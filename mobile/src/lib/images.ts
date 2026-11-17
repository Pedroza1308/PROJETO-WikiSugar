import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { AppError } from './errors';

export type ImageSource = 'camera' | 'library';

export interface PickedImage {
  uri: string;
  /** Can be 0 when the OS does not report it. */
  width: number;
  height: number;
}

/**
 * Opens the camera or the photo library and returns the chosen image, or null
 * when the user cancels. Throws AppError('PERMISSION_DENIED').
 */
export async function pickImage(source: ImageSource, options: { square?: boolean } = {}): Promise<PickedImage | null> {
  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: options.square ? [1, 1] : [4, 3],
    quality: 0.9,
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new AppError('PERMISSION_DENIED', 'Permita o uso da câmera nas configurações do aparelho.');
    }
    result = await ImagePicker.launchCameraAsync(pickerOptions);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  }

  const asset = result.canceled ? null : result.assets[0];
  return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
}

/** Shrinks to `maxWidth` (never enlarges) and re-encodes as JPEG to keep uploads small. */
export async function toJpeg(image: PickedImage, maxWidth: number, compress = 0.72): Promise<string> {
  const context = ImageManipulator.manipulate(image.uri);
  if (image.width === 0 || image.width > maxWidth) {
    context.resize({ width: maxWidth, height: null });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress, format: SaveFormat.JPEG });
  return saved.uri;
}

/** Reads a local file into an ArrayBuffer (what Supabase Storage expects in React Native). */
export async function readFile(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

/** Unique-enough object name inside the user's own folder. */
export function newObjectName(userId: string, extension = 'jpg'): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${userId}/${Date.now()}-${random}.${extension}`;
}
