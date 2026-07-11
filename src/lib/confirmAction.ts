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
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) void onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
