import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Image
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import ChatListItem from '../components/ChatListItem';
import MessageBubble from '../components/MessageBubble';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';

const Chats = () => {
  const { colors } = useTheme();
  const { 
    contacts, 
    activeContactId, 
    setActiveContactId, 
    getMessages, 
    sendMessage,
    markAsRead
  } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef<FlatList | null>(null);

  const messages = activeContactId ? getMessages(activeContactId) : [];
  const activeContact = contacts.find(c => c.id === activeContactId);

  useEffect(() => {
    // Mark messages as read when contact is selected
    if (activeContactId) {
      markAsRead(activeContactId);
    }
    // Scroll to bottom when opening a chat
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
    // Only depend on activeContactId!
  }, [activeContactId]);

  const handleSendMessage = () => {
    if ((!inputMessage.trim()) || !activeContactId) return;
    sendMessage(inputMessage.trim(), activeContactId);
    setInputMessage('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handlePickImage = () => {
    if (!activeContactId) return;
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };
    launchImageLibrary(options, (response: any) => {
      if (response.didCancel) {
        return;
      } else if (response.errorCode) {
        return;
      } else if (response.assets && response.assets.length > 0) {
        const selectedAsset = response.assets[0];
        if (selectedAsset.uri) {
          sendMessage('', activeContactId, selectedAsset.uri);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    });
  };

  const renderChatsList = () => (
    <View style={styles.chatsListContainer}>
      <View style={[styles.header, { borderBottomColor: colors.border + '30' }]}> 
        <CustomText style={[styles.headerTitle, { color: colors.text }]}> 
          Messages 
        </CustomText> 
      </View> 
      <FlatList 
        data={contacts} 
        keyExtractor={item => item.id} 
        renderItem={({ item }) => ( 
          <ChatListItem 
            contact={item} 
            onPress={setActiveContactId} 
            isActive={activeContactId === item.id} 
          /> 
        )} 
      /> 
    </View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <Image 
        source={require('../assets/temp_images/profile.png')} 
        style={styles.emptyChatImage} 
      />
      <CustomText style={[styles.emptyChatText, { color: colors.subText }]}> 
        Select a conversation to start chatting 
      </CustomText> 
    </View>
  );

  const renderChatDetail = () => {
    if (!activeContactId || !activeContact) return renderEmptyChat();

    return (
      <KeyboardAvoidingView
        style={styles.chatDetailContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.chatHeader, { borderBottomColor: colors.border + '30' }]}> 
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setActiveContactId(null)} 
          > 
            <View style={styles.chevronLeft} />
          </TouchableOpacity> 
          <View style={styles.chatHeaderInfo}> 
            <Image source={activeContact.avatar} style={styles.headerAvatar} /> 
            <View> 
              <CustomText style={[styles.headerName, { color: colors.text }]}> 
                {activeContact.name} 
              </CustomText> 
              <CustomText style={[styles.headerStatus, { color: colors.subText }]}> 
                {activeContact.status === 'online' ? 'Online' : activeContact.lastSeen} 
              </CustomText> 
            </View> 
          </View> 
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMine={item.senderId === 'currentUser'}
            />
          )}
        />

        <View style={[styles.inputContainer, { borderTopColor: colors.border + '30' }]}> 
          <TouchableOpacity 
            style={styles.imageButton}
            onPress={handlePickImage}
          >
            <View style={styles.grayCircle} />
          </TouchableOpacity>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.navBar, color: colors.text }]} 
            placeholder="Type a message..." 
            placeholderTextColor={colors.subText} 
            value={inputMessage} 
            onChangeText={setInputMessage} 
            multiline 
          /> 
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSendMessage} 
            disabled={!inputMessage.trim()} 
          > 
            <View style={styles.blueCircle}>
              <View style={styles.triangle} />
            </View>
          </TouchableOpacity> 
        </View>
      </KeyboardAvoidingView>
    );
  };

  // On mobile, show either chat list or chat detail based on selection
  const isMobile = true; // For mobile first approach
  
  return (
    <SafeAreaView style={styles.container}>
      {isMobile && !activeContactId && renderChatsList()}
      {isMobile && activeContactId && renderChatDetail()}
      
      {/* For larger screens, we could show both side by side */}
      {!isMobile && (
        <View style={styles.tabletContainer}>
          {renderChatsList()}
          {renderChatDetail()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  // Chats List Styles
  chatsListContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Empty Chat Styles
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChatImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyChatText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Chat Detail Styles
  chatDetailContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  chevronLeft: {
    width: 18,
    height: 18,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#333',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerStatus: {
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  grayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  blueCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: 16,
    borderBottomWidth: 24,
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
    borderBottomColor: '#fff',
    backgroundColor: 'transparent',
    transform: [{ rotate: '90deg' }],
    marginLeft: 8,
  },
});

export default Chats;
