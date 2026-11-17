import { supabase } from '../lib/supabase';
import type { GroupRole, GroupSearchResult, GroupSummary, JoinGroupResult, LeaderboardEntry } from '../types';
import { avatarUrl } from './profileService';

interface MyGroupRow {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  role: GroupRole;
  member_count: number;
  max_members: number;
  my_points: number;
  my_rank: number;
  joined_at: string;
}

interface SearchRow {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  member_count: number;
  max_members: number;
  is_member: boolean;
  is_full: boolean;
}

interface LeaderboardRow {
  user_id: string;
  name: string;
  avatar_path: string | null;
  role: GroupRole;
  points: number;
  checkin_count: number;
  place: number;
}

function toSummary(r: MyGroupRow): GroupSummary {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    inviteCode: r.invite_code,
    role: r.role,
    memberCount: r.member_count,
    maxMembers: r.max_members,
    myPoints: r.my_points,
    myRank: r.my_rank,
    joinedAt: r.joined_at,
  };
}

/** Creates a group (the creator becomes its owner) and returns its invite code. */
export async function createGroup(input: { name: string; description: string; password: string }) {
  const { data, error } = await supabase.rpc('create_group', {
    p_name: input.name.trim(),
    p_password: input.password,
    p_description: input.description.trim() || null,
  });
  if (error) throw error;
  const row = (data as { id: string; name: string; invite_code: string }[])[0];
  return { id: row.id, name: row.name, inviteCode: row.invite_code };
}

/** Finds groups by invite code (with or without #) or by name. */
export async function searchGroups(query: string): Promise<GroupSearchResult[]> {
  const { data, error } = await supabase.rpc('search_groups', { p_query: query.trim() });
  if (error) throw error;
  return ((data ?? []) as SearchRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    inviteCode: r.invite_code,
    memberCount: r.member_count,
    maxMembers: r.max_members,
    isMember: r.is_member,
    isFull: r.is_full,
  }));
}

/** Joins a group with its password. Capacity and password are checked by the database. */
export async function joinGroup(groupId: string, password: string): Promise<JoinGroupResult> {
  const { data, error } = await supabase.rpc('join_group', { p_group_id: groupId, p_password: password });
  if (error) throw error;
  return data as JoinGroupResult;
}

export async function listMyGroups(): Promise<GroupSummary[]> {
  const { data, error } = await supabase.rpc('my_groups');
  if (error) throw error;
  return ((data ?? []) as MyGroupRow[]).map(toSummary);
}

/** A group the user belongs to, or null (not found or not a member). */
export async function getGroup(groupId: string): Promise<GroupSummary | null> {
  const { data, error } = await supabase.rpc('my_groups').eq('id', groupId).maybeSingle();
  if (error) throw error;
  return data ? toSummary(data as MyGroupRow) : null;
}

export async function getLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('group_leaderboard', { p_group_id: groupId });
  if (error) throw error;
  return ((data ?? []) as LeaderboardRow[]).map((r) => ({
    userId: r.user_id,
    name: r.name,
    avatarUrl: avatarUrl(r.avatar_path),
    role: r.role,
    points: r.points,
    checkinCount: r.checkin_count,
    place: r.place,
  }));
}

export const JOIN_MESSAGES: Record<Exclude<JoinGroupResult, 'OK'>, string> = {
  NOT_FOUND: 'Este grupo não existe mais.',
  ALREADY_MEMBER: 'Você já participa deste grupo.',
  GROUP_FULL: 'Este grupo atingiu o limite de 10 participantes. Não é possível entrar.',
  INVALID_PASSWORD: 'Senha incorreta. Confira com quem criou o grupo.',
  TOO_MANY_ATTEMPTS: 'Muitas tentativas com senha errada. Tente de novo em 15 minutos.',
};
