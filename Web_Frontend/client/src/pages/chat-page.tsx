import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/use-auth';

interface Message {
  author: string;
  body: string;
  created: string;
}

interface ChatGroup {
  id: number;
  group_name: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const websocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat groups on load
  useEffect(() => {
    fetch('http://localhost:8000/chat/get-chat-groups/')
      .then((res) => res.json())
      .then(setChatGroups)
      .catch((err) => console.error('Error fetching chat groups:', err));
  }, []);

  // WebSocket connection effect
  useEffect(() => {
    if (!selectedGroup) return;

    const roomName = selectedGroup.group_name;
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);

    ws.onopen = () => {
      console.log('Connected to chat server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        const message = {
          author: data.message.author,
          body: data.message.body,
          created: data.message.created
        };
        setMessages((prev) => [...prev, message]);
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
      setConnected(false);
      setMessages([]); // Clear messages when switching groups
    };
  }, [selectedGroup]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !websocket.current) return;
    const messageData = { body: messageInput };
    websocket.current.send(JSON.stringify(messageData));
    setMessageInput('');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/chat/create-chat-group/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: newGroupName })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.group_name?.[0] || 'Failed to create group');
        return;
      }
      const newGroup: ChatGroup = await res.json();
      setChatGroups((prev) => [...prev, newGroup]);
      setNewGroupName('');
      setSelectedGroup(newGroup); // Auto-select newly created group
    } catch (err) {
      console.error('Error creating chat group:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4 max-w-6xl mx-auto">
      {/* Chat group selection / creation section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            value={selectedGroup?.id || ''}
            onChange={(e) => {
              const groupId = Number(e.target.value);
              const group = chatGroups.find((g) => g.id === groupId) || null;
              setSelectedGroup(group);
            }}
            className="border rounded-lg px-4 py-2 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a chat room</option>
            {chatGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.group_name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New room name"
            className="border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleCreateGroup}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium shadow-sm"
          >
            Create Room
          </button>
        </div>

        {selectedGroup && (
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <span>Active Room:</span>
            <span className="font-semibold text-blue-600">{selectedGroup.group_name}</span>
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-md p-6 mb-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <div>No messages yet</div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-6 ${message.author === user?.username ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block rounded-lg px-6 py-3 max-w-[70%] shadow-sm ${
                  message.author === user?.username
                    ? 'bg-[#990000] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="font-semibold text-sm mb-1">{message.author}</div>
                <div className="text-base">{message.body}</div>
                <div className="text-xs mt-2 opacity-75">{message.created}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="flex gap-4">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-gray-300 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          disabled={!connected}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm"
          disabled={!connected || !messageInput.trim()}
        >
          Send
        </button>
      </form>

      {!connected && selectedGroup && (
        <div className="text-red-500 text-center mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          Disconnected from chat server. Please refresh or re-select the room.
        </div>
      )}
    </div>
  );
}
