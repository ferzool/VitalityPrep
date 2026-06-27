import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../src/components/Icon';
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
  const insets = useSafeAreaInsets();

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
            paddingBottom: Math.max(insets.bottom, 12),
            height: 60 + Math.max(insets.bottom, 12),
          },
        ],
        tabBarLabelStyle: [fonts.labelCaps, { marginBottom: 4 }],
        tabBarItemStyle: { paddingTop: 6 },
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
    borderTopColor: colors.outlineVariant,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.stackSm,
  },
});
