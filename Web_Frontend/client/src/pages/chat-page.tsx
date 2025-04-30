import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/use-auth';

interface Message {
  author: string;
  body: string;
  created: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const websocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Replace with your actual WebSocket URL and room name
    const roomName = 'testroom'; // This should come from your route params or state
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);

    ws.onopen = () => {
      console.log('Connected to chat server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      const data = JSON.parse(event.data);

      // Make sure we have the correct data structure
      if (data.message) {
        const message = {
          author: data.message.author,
          body: data.message.body,
          created: data.message.created
        };

        setMessages((prevMessages) => [...prevMessages, message]);
      } else {
        console.error('Unexpected message format:', data);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from chat server');
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !websocket.current) return;

    const messageData = {
      body: messageInput
    };

    console.log('Sending message:', messageData);
    websocket.current.send(JSON.stringify(messageData));

    // Don't add the message to the UI here
    // Let the WebSocket broadcast handle it

    setMessageInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No messages yet</div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.author === user?.username ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block rounded-lg px-4 py-2 max-w-[70%] ${
                  message.author === user?.username
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="font-semibold text-sm">{message.author}</div>
                <div className="mt-1">{message.body}</div>
                <div className="text-xs opacity-75 mt-1">{message.created}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
          disabled={!connected}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!connected || !messageInput.trim()}
        >
          Send
        </button>
      </form>

      {!connected && (
        <div className="text-red-500 text-center mt-2">
          Disconnected from chat server. Please refresh the page.
        </div>
      )}
    </div>
  );
}