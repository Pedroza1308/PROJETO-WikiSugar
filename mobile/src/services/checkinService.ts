import { PickedImage, newObjectName, readFile, toJpeg } from '../lib/images';
import { BUCKETS, supabase } from '../lib/supabase';
import type { FeedItem, MyCheckin } from '../types';
import { avatarUrl } from './profileService';

/** Signed URLs for private check-in photos are valid for one hour. */
const SIGNED_URL_TTL_S = 60 * 60;

export const FEED_PAGE_SIZE = 20;
export const MY_CHECKINS_PAGE_SIZE = 30;

interface FeedRow {
  checkin_id: string;
  user_id: string;
  author_name: string;
  author_avatar_path: string | null;
  photo_path: string;
  caption: string | null;
  created_at: string;
  points: number;
}

interface MyCheckinRow {
  checkin_id: string;
  photo_path: string;
  caption: string | null;
  created_at: string;
  total_points: number;
  groups: { group_id: string; name: string; points: number }[];
}

/** Batch-signs private photo paths. Missing/denied paths map to null. */
async function signPhotos(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data, error } = await supabase.storage.from(BUCKETS.checkins).createSignedUrls(paths, SIGNED_URL_TTL_S);
  if (error) throw error;
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

/**
 * Publishes a photo check-in: uploads the photo to checkins/<uid>/... and asks
 * the database to register it. The database stores the exact server time and
 * gives +10 points to the author in each selected group (and only in those).
 */
export async function createCheckin(input: {
  userId: string;
  photo: PickedImage;
  caption: string;
  groupIds: string[];
}): Promise<string> {
  const jpeg = await toJpeg(input.photo, 1280, 0.72);
  const path = newObjectName(input.userId);
  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.checkins)
    .upload(path, await readFile(jpeg), { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.rpc('create_checkin', {
    p_photo_path: path,
    p_group_ids: input.groupIds,
    p_caption: input.caption.trim() || null,
  });
  if (error) {
    // Clean up the orphan upload (allowed only while it is not a published check-in).
    await supabase.storage.from(BUCKETS.checkins).remove([path]);
    throw error;
  }
  return data as string;
}

/** Group feed, newest first. Pass the last item's createdAt to load older posts. */
export async function getGroupFeed(groupId: string, before?: string): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('group_feed', {
    p_group_id: groupId,
    p_limit: FEED_PAGE_SIZE,
    p_before: before ?? null,
  });
  if (error) throw error;
  const rows = (data ?? []) as FeedRow[];
  const urls = await signPhotos(rows.map((r) => r.photo_path));
  return rows.map((r) => ({
    checkinId: r.checkin_id,
    userId: r.user_id,
    authorName: r.author_name,
    authorAvatarUrl: avatarUrl(r.author_avatar_path),
    photoUrl: urls.get(r.photo_path) ?? null,
    caption: r.caption,
    createdAt: r.created_at,
    points: r.points,
  }));
}

/** The user's own check-ins (gallery + points history), newest first. */
export async function getMyCheckins(before?: string): Promise<MyCheckin[]> {
  const { data, error } = await supabase.rpc('my_checkins', {
    p_limit: MY_CHECKINS_PAGE_SIZE,
    p_before: before ?? null,
  });
  if (error) throw error;
  const rows = (data ?? []) as MyCheckinRow[];
  const urls = await signPhotos(rows.map((r) => r.photo_path));
  return rows.map((r) => ({
    checkinId: r.checkin_id,
    photoUrl: urls.get(r.photo_path) ?? null,
    caption: r.caption,
    createdAt: r.created_at,
    totalPoints: r.total_points,
    groups: (r.groups ?? []).map((g) => ({ groupId: g.group_id, name: g.name, points: g.points })),
  }));
}
