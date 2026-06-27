import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function readEnvInset(name: 'top' | 'bottom' | 'left' | 'right'): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.paddingTop = `env(safe-area-inset-${name}, 0px)`;
  document.body.appendChild(probe);
  const value = Number.parseFloat(getComputedStyle(probe).paddingTop) || 0;
  document.body.removeChild(probe);
  return value;
}

/**
 * useSafeInsets returns reliable safe-area insets in every environment:
 * - native: react-native-safe-area-context values
 * - web standalone PWA: reads CSS env() directly when the lib returns 0
 */
export function useSafeInsets(): Insets {
  const libInsets = useSafeAreaInsets();
  const [envInsets, setEnvInsets] = useState<Insets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => {
      setEnvInsets({
        top: readEnvInset('top'),
        bottom: readEnvInset('bottom'),
        left: readEnvInset('left'),
        right: readEnvInset('right'),
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (Platform.OS !== 'web') return libInsets as Insets;

  return {
    top: Math.max(libInsets.top, envInsets.top),
    bottom: Math.max(libInsets.bottom, envInsets.bottom),
    left: Math.max(libInsets.left, envInsets.left),
    right: Math.max(libInsets.right, envInsets.right),
  };
}
