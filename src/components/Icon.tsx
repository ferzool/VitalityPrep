import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type MIName = ComponentProps<typeof MaterialIcons>['name'];

export type IconName =
  | 'arrow-back'
  | 'fire'
  | 'schedule'
  | 'check'
  | 'basket'
  | 'restaurant'
  | 'person'
  | 'add'
  | 'remove'
  | 'close'
  | 'delete'
  | 'language'
  | 'chevron-right'
  | 'translate'
  | 'list-alt'
  | 'info'
  | 'search'
  | 'image'
  | 'photo-camera'
  | 'event'
  | 'tune'
  | 'restaurant-menu'
  | 'share'
  | 'download'
  | 'cloud-upload'
  | 'content-copy'
  | 'auto-awesome'
  | 'chevron-down'
  | 'edit'
  | 'open-in-new'
  | 'qr-code'
  | 'qr-code-scanner';

const map: Record<IconName, MIName> = {
  'arrow-back': 'arrow-back-ios',
  fire: 'local-fire-department',
  schedule: 'schedule',
  check: 'check',
  basket: 'shopping-basket',
  restaurant: 'restaurant-menu',
  person: 'person',
  add: 'add',
  remove: 'remove',
  close: 'close',
  delete: 'delete-outline',
  language: 'language',
  'chevron-right': 'chevron-right',
  translate: 'translate',
  'list-alt': 'list-alt',
  info: 'info-outline',
  search: 'search',
  image: 'image',
  'photo-camera': 'photo-camera',
  event: 'event',
  tune: 'tune',
  'restaurant-menu': 'restaurant-menu',
  share: 'ios-share',
  download: 'file-download',
  'cloud-upload': 'cloud-upload',
  'content-copy': 'content-copy',
  'auto-awesome': 'auto-awesome',
  'chevron-down': 'expand-more',
  edit: 'edit',
  'open-in-new': 'open-in-new',
  'qr-code': 'qr-code-2',
  'qr-code-scanner': 'qr-code-scanner',
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

const filledMap: Partial<Record<IconName, MIName>> = {
  fire: 'local-fire-department',
  basket: 'shopping-basket',
  restaurant: 'restaurant',
  person: 'person',
  check: 'check-circle',
};

export function Icon({ name, size = 24, color, filled }: IconProps) {
  const mi = (filled && filledMap[name]) || map[name];
  return <MaterialIcons name={mi} size={size} color={color} />;
}
