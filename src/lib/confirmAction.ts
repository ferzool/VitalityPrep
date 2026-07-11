import { Alert, Platform } from 'react-native';

interface ConfirmActionOptions {
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
}

/** Reliable destructive confirmation for native and installed web/PWA builds. */
export function confirmAction({
  title,
  message,
  cancelText,
  confirmText,
  onConfirm,
}: ConfirmActionOptions): void {
  const run = () => {
    void Promise.resolve(onConfirm()).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
      else Alert.alert(title, message);
    });
  };
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) run();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: run },
  ]);
}
