import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TopBar from './TopBar';
import SidebarModal from './SidebarModal';
import { useTheme } from '../context/ThemeContext';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { colors } = useTheme();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar onMenuPress={() => setSidebarVisible(true)} />
      <SidebarModal visible={sidebarVisible} onClose={() => setSidebarVisible(false)} colors={colors} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default Layout;
