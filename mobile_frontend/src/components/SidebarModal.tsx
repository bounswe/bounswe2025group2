import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface SidebarModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;
}

const pages = [
  { name: 'Home', label: 'Home' },
  { name: 'Forum', label: 'Forum' },
  { name: 'Goals', label: 'Goals' },
  { name: 'Profile', label: 'Profile' },
  { name: 'Settings', label: 'Settings' },
  { name: 'Notifications', label: 'Notifications' },
  { name: 'AddNew', label: 'Add New' },
  { name: 'Chats', label: 'Chats' },
];

const SidebarModal: React.FC<SidebarModalProps> = ({ visible, onClose, colors }) => {
  const navigation = useNavigation();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[styles.sidebar, { backgroundColor: colors.navBar }]}> 
          <Text style={[styles.header, { color: colors.text }]}>GenFit</Text>
          <View style={[styles.divider, { backgroundColor: colors.active }]} />
          {pages.map(page => (
            <Pressable
              key={page.name}
              style={[styles.link, { borderBottomColor: colors.border }]}
              onPress={() => {
                onClose();
                navigation.navigate(page.name as never);
              }}
            >
              <Text style={[styles.linkText, { color: colors.text }]}>{page.label}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.closeBtn, { backgroundColor: colors.active }]} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: colors.background }]}>✕ Close</Text>
          </Pressable>
        </View>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    padding: 24,
    justifyContent: 'flex-start',
    elevation: 8,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  divider: {
    height: 2,
    marginBottom: 24,
    borderRadius: 1,
  },
  link: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  closeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default SidebarModal;
