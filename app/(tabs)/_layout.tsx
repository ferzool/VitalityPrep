import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Icon, type IconName } from '../../src/components/Icon';
import { useSafeInsets } from '../../src/hooks/useSafeInsets';
import { useTranslation } from '../../src/hooks/useTranslation';
import { colors, spacing } from '../../src/theme';

function TabIcon({
  name,
  focused,
  color,
}: {
  name: IconName;
  focused: boolean;
  color: string;
}) {
  return <Icon name={name} size={24} color={color} filled={focused} />;
}

export default function TabsLayout() {
  const { t, fonts } = useTranslation();
  const insets = useSafeInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const barHeight = 56 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: [
          styles.bar,
          {
            paddingBottom: bottomInset,
            height: barHeight,
          },
        ],
        tabBarLabelStyle: [fonts.labelCaps, { marginBottom: 2 }],
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: { paddingTop: 8, paddingBottom: 2 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.recipes'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="restaurant" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t('tabs.planner'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="event" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: t('tabs.list'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="basket" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: spacing.stackSm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
});
