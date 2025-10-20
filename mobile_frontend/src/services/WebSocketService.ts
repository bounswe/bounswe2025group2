import { Message } from '../context/ChatContext';
import Cookies from '@react-native-cookies/cookies';

export class WebSocketService {
  private ws: any = null;
  private chatId: number | null = null;
  private onMessageCallback: ((message: Message) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  async connect(chatId: number, onMessage: (message: Message) => void, onError: (error: string) => void, onConnect: () => void, onDisconnect: () => void) {
    // Disconnect from previous chat if connected to a different one
    if (this.ws && this.chatId !== chatId) {
      console.log('Disconnecting from previous chat:', this.chatId);
      this.disconnect();
    }
    
    // Don't reconnect if already connected to the same chat
    if (this.ws && this.chatId === chatId && this.ws.readyState === 1) {
      console.log('Already connected to chat:', chatId);
      return;
    }
    
    this.chatId = chatId;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;

    try {
      // Get session cookie for authentication
      const cookies = await Cookies.get('http://164.90.166.81:8000');
      
      if (!cookies || Object.keys(cookies).length === 0) {
        console.error('No session cookies found. User may not be authenticated.');
        if (this.onErrorCallback) {
          this.onErrorCallback('Not authenticated. Please log in first.');
        }
        return;
      }

      const sessionCookie = cookies.sessionid?.value;

      if (!sessionCookie) {
        console.error('No session cookie found. User may not be authenticated.');
        if (this.onErrorCallback) {
          this.onErrorCallback('No session found. Please log in again.');
        }
        return;
      }

      // WebSocket URL with session cookie as query parameter
      const wsUrl = `ws://164.90.166.81:8000/ws/chat/${chatId}/?sessionid=${sessionCookie}`;
      
      // Use native WebSocket API with session cookie in URL
      this.ws = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Error checking authentication:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Authentication check failed');
      }
      return;
    }

    this.ws.onopen = () => {
      console.log('WebSocket connected to chat:', chatId);
      if (this.onConnectCallback) {
        this.onConnectCallback();
      }
    };

    this.ws.onmessage = (event: any) => {
      // Check if this is still the active connection
      if (!this.ws || this.ws.readyState !== 1) {
        console.log('Ignoring message from closed/inactive WebSocket');
        return;
      }
      
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          console.error('WebSocket error:', data.error);
          if (this.onErrorCallback) {
            this.onErrorCallback(data.error);
          }
        } else if (data.message) {
          // Transform the message to match our Message type
          const message: Message = {
            id: data.message.id,
            sender: data.message.sender,
            body: data.message.body,
            created: data.message.created,
            is_read: data.message.is_read
          };
          
          
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback('Failed to parse message');
        }
      }
    };

    this.ws.onerror = (error: any) => {
      console.error('WebSocket error:', error);
      console.error('Error details:', JSON.stringify(error));
      if (this.onErrorCallback) {
        this.onErrorCallback('Connection error: ' + (error.message || 'Unknown error'));
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected from chat:', chatId);
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback();
      }
    };
  }

  sendMessage(messageBody: string) {
    if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN = 1
      const message = {
        body: messageBody
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      if (this.onErrorCallback) {
        this.onErrorCallback('Not connected to chat');
      }
    }
  }

  disconnect() {
    if (this.ws) {
      // Remove all event listeners to prevent processing stale data
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      // Close the connection
      this.ws.close();
      this.ws = null;
    }
    
    // Clear all callbacks and state
    this.chatId = null;
    this.onMessageCallback = null;
    this.onErrorCallback = null;
    this.onConnectCallback = null;
    this.onDisconnectCallback = null;
    
    console.log('WebSocket disconnected and cleaned up');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === 1; // WebSocket.OPEN = 1
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
