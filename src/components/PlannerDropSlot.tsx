import type { PropsWithChildren } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import type { Day, MealSlot } from '../types';
import { colors, radius } from '../theme';
import { Icon } from './Icon';

export interface PlannerSlotAddress {
  day: Day;
  slot: MealSlot;
}

interface PlannerDropSlotProps extends PropsWithChildren {
  address: PlannerSlotAddress;
  draggable?: boolean;
  isDropTarget?: boolean;
  isSelected?: boolean;
  isRTL?: boolean;
  dragLabel: string;
  register: (address: PlannerSlotAddress, node: View | null) => void;
  onDragStart: (source: PlannerSlotAddress) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (source: PlannerSlotAddress, pageX: number, pageY: number) => void;
  onDragTap: (source: PlannerSlotAddress) => void;
}

export function PlannerDropSlot({
  address,
  children,
  draggable = false,
  isDropTarget = false,
  isSelected = false,
  isRTL = false,
  dragLabel,
  register,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragTap,
}: PlannerDropSlotProps) {
  const translation = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  const finishDrag = (
    event: GestureResponderEvent,
    gesture: PanResponderGestureState,
  ) => {
    setDragging(false);
    const didMove = Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6;
    const pageX = gesture.moveX || event.nativeEvent.pageX;
    const pageY = gesture.moveY || event.nativeEvent.pageY;
    if (didMove) onDragEnd(address, pageX, pageY);
    else onDragTap(address);
    Animated.spring(translation, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => draggable,
        onMoveShouldSetPanResponder: () => draggable,
        onPanResponderGrant: () => {
          translation.setValue({ x: 0, y: 0 });
          setDragging(true);
          onDragStart(address);
        },
        onPanResponderMove: (_event, gesture) => {
          translation.setValue({ x: gesture.dx, y: gesture.dy });
          onDragMove(gesture.moveX, gesture.moveY);
        },
        onPanResponderRelease: finishDrag,
        onPanResponderTerminate: finishDrag,
      }),
    [address.day, address.slot, draggable, onDragEnd, onDragMove, onDragStart, onDragTap, translation],
  );

  return (
    <View
      ref={(node) => register(address, node)}
      style={dragging && styles.draggingContainer}
    >
      <Animated.View
        style={[
          dragging && styles.dragging,
          isDropTarget && styles.dropTarget,
          isSelected && styles.selected,
          { transform: translation.getTranslateTransform() },
        ]}
      >
        {children}
        {draggable ? (
          <View
            {...panResponder.panHandlers}
            collapsable={false}
            accessible
            accessibilityRole="button"
            accessibilityLabel={dragLabel}
            style={[
              styles.handle,
              isRTL ? styles.handleLeft : styles.handleRight,
              Platform.OS === 'web' && ({ touchAction: 'none', cursor: 'grab' } as never),
            ]}
          >
            <Icon name="drag" size={20} color={colors.onPrimary} />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  draggingContainer: {
    zIndex: 100,
    elevation: 16,
  },
  dragging: {
    zIndex: 100,
    elevation: 16,
    opacity: 0.94,
  },
  dropTarget: {
    borderRadius: radius.lg,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  selected: {
    borderRadius: radius.lg,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  handle: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  handleRight: { right: 8 },
  handleLeft: { left: 8 },
});
