import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useSignalR } from '../../contexts/SignalRContext';
import api from '../../services/api';
import { Send, User as UserIcon, Users as UsersIcon, MessageSquare } from 'lucide-react';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { connection } = useSignalR();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Users list for direct messages
  const [usersList, setUsersList] = useState([]);
  
  // Chat state: 'workspace' or 'direct'
  const [chatMode, setChatMode] = useState('workspace'); 
  const [selectedUser, setSelectedUser] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const fetchUsersList = async () => {
    try {
      const res = await api.get('/users');
      // Filter out the current user
      const others = (res.data || []).filter(u => u.userId !== user?.id);
      setUsersList(others);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeWorkspace, chatMode, selectedUser]);

  useEffect(() => {
    if (connection) {
      const handleWorkspaceMsg = (msg) => {
        if (chatMode === 'workspace' && activeWorkspace && msg.workspaceId !== null) {
          setMessages(prev => {
            if (prev.some(m => m.messageId === msg.messageId)) return prev;
            return [...prev, msg];
          });
          setTimeout(scrollToBottom, 100);
        }
      };

      const handleDirectMsg = (msg) => {
        if (chatMode === 'direct' && selectedUser) {
          // Check if this msg belongs to the conversation with selectedUser
          const isRelevant = 
            (msg.senderId === user.id && msg.receiverId === selectedUser.userId) ||
            (msg.senderId === selectedUser.userId && msg.receiverId === user.id);
            
          if (isRelevant) {
            setMessages(prev => {
              if (prev.some(m => m.messageId === msg.messageId)) return prev;
              return [...prev, msg];
            });
            setTimeout(scrollToBottom, 100);
          }
        }
      };

      connection.on('ReceiveMessage', handleWorkspaceMsg);
      connection.on('ReceiveDirectMessage', handleDirectMsg);

      return () => {
        connection.off('ReceiveMessage', handleWorkspaceMsg);
        connection.off('ReceiveDirectMessage', handleDirectMsg);
      };
    }
  }, [connection, chatMode, activeWorkspace, selectedUser, user]);

  const fetchMessages = async () => {
    setLoading(true);
    setMessages([]);
    try {
      if (chatMode === 'workspace' && activeWorkspace) {
        const res = await api.get(`/workspaces/${activeWorkspace.workspaceId}/chat?page=1&pageSize=50`);
        setMessages(res.data);
      } else if (chatMode === 'direct' && selectedUser) {
        const res = await api.get(`/chat/direct/${selectedUser.userId}?page=1&pageSize=50`);
        setMessages(res.data);
      }
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connection) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      if (chatMode === 'workspace' && activeWorkspace) {
        await connection.invoke('SendMessage', activeWorkspace.workspaceId, content);
      } else if (chatMode === 'direct' && selectedUser) {
        await connection.invoke('SendDirectMessage', selectedUser.userId, content);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (!activeWorkspace) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Vui lòng chọn một dự án để sử dụng tính năng Chat.</div>;
  }

  return (
    <div className="chat-layout">
      {/* Sidebar for choosing chat target */}
      <aside className="chat-sidebar glass-panel">
        <h3 className="chat-sidebar-title">Danh sách kênh</h3>
        
        <div 
          className={`chat-contact-item ${chatMode === 'workspace' ? 'active' : ''}`}
          onClick={() => { setChatMode('workspace'); setSelectedUser(null); }}
        >
          <div className="chat-contact-icon" style={{ background: 'var(--primary)', color: 'white' }}>
            <UsersIcon size={18} />
          </div>
          <div className="chat-contact-info">
            <div className="chat-contact-name">Chat Dự án</div>
            <div className="chat-contact-sub">{activeWorkspace.name}</div>
          </div>
        </div>

        <h3 className="chat-sidebar-title" style={{ marginTop: '20px' }}>Tin nhắn trực tiếp</h3>
        <div className="chat-contacts-list">
          {usersList.map(u => (
            <div 
              key={u.userId}
              className={`chat-contact-item ${chatMode === 'direct' && selectedUser?.userId === u.userId ? 'active' : ''}`}
              onClick={() => { setChatMode('direct'); setSelectedUser(u); }}
            >
              <div className="chat-contact-icon">
                <UserIcon size={18} />
              </div>
              <div className="chat-contact-info">
                <div className="chat-contact-name">{u.fullName || u.email}</div>
              </div>
            </div>
          ))}
          {usersList.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
              Chưa có thành viên nào khác.
            </div>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        <header className="chat-header">
          {chatMode === 'workspace' ? (
            <>
              <h2>Kênh chat: {activeWorkspace.name}</h2>
              <div className="chat-subtitle">Thảo luận chung của Dự án</div>
            </>
          ) : (
            <>
              <h2>{selectedUser?.fullName || selectedUser?.email}</h2>
              <div className="chat-subtitle">Tin nhắn trực tiếp</div>
            </>
          )}
        </header>

        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">Đang tải tin nhắn...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">Chưa có tin nhắn nào. Bắt đầu trò chuyện!</div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.messageId} className={`chat-message ${isMe ? 'message-me' : 'message-other'}`}>
                  {!isMe && (
                    <div className="message-avatar">
                      <UserIcon size={20} />
                    </div>
                  )}
                  <div className="message-content">
                    {!isMe && <div className="message-sender">{msg.senderName}</div>}
                    <div className="message-bubble">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {((chatMode === 'workspace') || (chatMode === 'direct' && selectedUser)) ? (
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..." 
              className="chat-input"
            />
            <button type="submit" disabled={!newMessage.trim()} className="chat-send-btn">
              <Send size={20} />
            </button>
          </form>
        ) : null}
      </main>
    </div>
  );
};

export default Chat;
