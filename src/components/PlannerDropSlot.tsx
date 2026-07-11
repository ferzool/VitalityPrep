import type { PropsWithChildren } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
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
  isRTL?: boolean;
  dragLabel: string;
  register: (address: PlannerSlotAddress, node: View | null) => void;
  onDragStart: (source: PlannerSlotAddress) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (source: PlannerSlotAddress, pageX: number, pageY: number) => void;
}

export function PlannerDropSlot({
  address,
  children,
  draggable = false,
  isDropTarget = false,
  isRTL = false,
  dragLabel,
  register,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PlannerDropSlotProps) {
  const translation = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  const finishDrag = (
    _event: GestureResponderEvent,
    gesture: PanResponderGestureState,
  ) => {
    setDragging(false);
    onDragEnd(address, gesture.moveX, gesture.moveY);
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
    [address.day, address.slot, draggable, onDragEnd, onDragMove, onDragStart, translation],
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
          { transform: translation.getTranslateTransform() },
        ]}
      >
        {children}
        {draggable ? (
          <Pressable
            {...panResponder.panHandlers}
            accessibilityRole="button"
            accessibilityLabel={dragLabel}
            hitSlop={8}
            style={({ pressed }) => [
              styles.handle,
              isRTL ? styles.handleLeft : styles.handleRight,
              pressed && styles.handlePressed,
            ]}
          >
            <Icon name="drag" size={20} color={colors.onPrimary} />
          </Pressable>
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
  handlePressed: { opacity: 0.75 },
});
