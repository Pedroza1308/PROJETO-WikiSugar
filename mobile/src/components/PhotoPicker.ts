import { Alert } from 'react-native';
import { PickedImage, pickImage } from '../lib/images';

/**
 * Asks "camera or gallery" and resolves with the chosen photo, or null when
 * the user cancels. Rejects with AppError('PERMISSION_DENIED').
 */
export function choosePhoto(title: string, options: { square?: boolean } = {}): Promise<PickedImage | null> {
  return new Promise((resolve, reject) => {
    const run = (source: 'camera' | 'library') => pickImage(source, options).then(resolve, reject);
    Alert.alert(
      title,
      undefined,
      [
        { text: 'Tirar foto', onPress: () => void run('camera') },
        { text: 'Escolher da galeria', onPress: () => void run('library') },
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
