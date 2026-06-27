import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { parseRecipeQrPayload, QrInvalid } from '../lib/recipeQr';
import { colors, radius, spacing } from '../theme';
import type { Recipe } from '../types';
import { Icon } from './Icon';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (recipe: Recipe) => void;
}

export function QrScannerModal({
  visible,
  onClose,
  onScanned,
}: QrScannerModalProps) {
  const { fonts, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      scannedRef.current = false;
      setError(null);
      if (permission && !permission.granted && permission.canAskAgain) {
        requestPermission();
      }
    }
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    };
  }, [visible, permission, requestPermission]);

  const handleBarcode = (data: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    try {
      const recipe = parseRecipeQrPayload(data);
      onScanned(recipe);
    } catch (err) {
      if (err instanceof QrInvalid) {
        setError(t('qr.invalid'));
      } else {
        setError(t('qr.scanError'));
      }
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        scannedRef.current = false;
        setError(null);
        errorTimerRef.current = null;
      }, 2500);
    }
  };

  const renderContent = () => {
    if (!permission) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#ffffff" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={[styles.center, { paddingHorizontal: spacing.marginMobile }]}>
          <Icon name="photo-camera" size={48} color="#ffffff" />
          <Text
            style={[
              fonts.headlineMd,
              { color: '#ffffff', textAlign: 'center', marginTop: spacing.gutter },
            ]}
          >
            {t('qr.permissionTitle')}
          </Text>
          <Text
            style={[
              fonts.bodyLg,
              {
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                marginTop: spacing.stackMd,
              },
            ]}
          >
            {t('qr.permissionHint')}
          </Text>
          <Pressable
            onPress={
              permission.canAskAgain
                ? requestPermission
                : () => Linking.openSettings()
            }
            style={({ pressed }) => [
              styles.permissionBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[fonts.labelCaps, { color: colors.onPrimary }]}>
              {permission.canAskAgain
                ? t('qr.allowCamera')
                : t('qr.openSettings')}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => handleBarcode(data)}
        />
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.reticle} />
          <Text
            style={[
              fonts.bodyLg,
              { color: '#ffffff', textAlign: 'center', marginTop: spacing.stackLg },
            ]}
          >
            {t('qr.aimHint')}
          </Text>
          {error ? (
            <View style={styles.errorPill}>
              <Text style={[fonts.bodySm, { color: '#ffffff' }]}>{error}</Text>
            </View>
          ) : null}
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {renderContent()}
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            {
              top: insets.top + spacing.gutter,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Icon name="close" size={22} color="#ffffff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 240,
    height: 240,
    borderRadius: radius.xl,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  permissionBtn: {
    marginTop: spacing.stackLg,
    paddingVertical: spacing.stackMd,
    paddingHorizontal: spacing.marginMobile,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  errorPill: {
    marginTop: spacing.gutter,
    paddingVertical: 8,
    paddingHorizontal: spacing.gutter,
    backgroundColor: 'rgba(186, 26, 26, 0.92)',
    borderRadius: radius.pill,
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.marginMobile,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
