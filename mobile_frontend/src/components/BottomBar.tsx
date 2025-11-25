import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomBar = ({ state, navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const routes = [
    { key: 'Home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'Forum', title: 'Forum', focusedIcon: 'forum', unfocusedIcon: 'forum-outline' },
    { key: 'Chats', title: 'Chats', focusedIcon: 'message', unfocusedIcon: 'message-outline' },
    { key: 'Goals', title: 'Goals', focusedIcon: 'flag-checkered', unfocusedIcon: 'flag-outline' },
    { key: 'Challenges', title: 'Challenges', focusedIcon: 'medal', unfocusedIcon: 'medal-outline' },
  ];

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          paddingBottom: insets.bottom,
          borderTopColor: theme.colors.outlineVariant,
        }
      ]}
    >
      {routes.map((route, index) => {
        const isActive = state.index === index;
        const iconName = isActive ? route.focusedIcon : route.unfocusedIcon;
        const color = isActive ? theme.colors.primary : theme.colors.onSurfaceVariant;

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => navigation.navigate(route.key)}
          >
            <Icon name={iconName} size={24} color={color} />
            <Text 
              variant="labelSmall" 
              style={[styles.label, { color }]}
            >
              {route.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  label: {
    marginTop: 4,
  },
});

export default BottomBar;
