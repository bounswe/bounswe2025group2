import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Cookies from '@react-native-cookies/cookies';

type SettingAction = {
  label: string;
  onPress: () => void;
  subtitle?: string;
};

const Settings = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const fadeInAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeInAnim]);

  const handleEditProfile = () => {
    navigation.navigate('Profile' as never);
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications' as never);
  };

  const handlePrivacy = () => {
    navigation.navigate('PrivacySettings' as never);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://10.0.2.2:8000/api/logout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      await Cookies.clearAll(true);
      await logout?.();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    }
  };

  const actions = useMemo<SettingAction[]>(
    () => [
      {
        label: 'Edit Profile',
        subtitle: 'Update your personal details',
        onPress: handleEditProfile,
      },
      {
        label: 'Notification Preferences',
        subtitle: 'Manage alerts and reminders',
        onPress: handleNotifications,
      },
      {
        label: 'Privacy & Security',
        subtitle: 'Control data and security settings',
        onPress: handlePrivacy,
      },
      {
        label: 'Log Out',
        subtitle: 'Sign out from this device',
        onPress: handleLogout,
      },
    ],
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: fadeInAnim,
            transform: [
              {
                translateY: fadeInAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.switchRow}>
          <View>
            <CustomText style={[styles.title, { color: colors.text }]}>
              Dark Theme
            </CustomText>
            <CustomText style={[styles.subtitle, { color: colors.subText }]}>
              Switch between light and dark appearance
            </CustomText>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.active }}
            thumbColor={colors.navBar}
            value={isDark}
            onValueChange={toggleTheme}
          />
        </View>
      </Animated.View>

      {actions.map((action, index) => (
        <AnimatedSettingRow
          key={action.label}
          action={action}
          colors={colors}
          delay={120 * (index + 1)}
        />
      ))}
    </View>
  );
};

type AnimatedSettingRowProps = {
  action: SettingAction;
  colors: ReturnType<typeof useTheme>['colors'];
  delay?: number;
};

const AnimatedSettingRow: React.FC<AnimatedSettingRowProps> = ({
  action,
  colors,
  delay = 0,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 400,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [appear, delay]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: appear,
          transform: [
            { scale },
            {
              translateY: appear.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        android_ripple={{ color: colors.border }}
        style={styles.pressable}
        onPress={action.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.textBlock}>
          <CustomText style={[styles.title, { color: colors.text }]}>
            {action.label}
          </CustomText>
          {action.subtitle ? (
            <CustomText style={[styles.subtitle, { color: colors.subText }]}>
              {action.subtitle}
            </CustomText>
          ) : null}
        </View>
        <View style={[styles.chevron, { borderColor: colors.border }]} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 4 },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  textBlock: { flex: 1, paddingRight: 12 },
  chevron: {
    width: 10,
    height: 10,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '-45deg' }],
  },
});

export default Settings;
