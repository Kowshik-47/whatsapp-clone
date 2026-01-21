import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import { 
  BsArrowLeft, BsThreeDotsVertical, BsSearch,
  BsEmojiSmile, BsPaperclip, BsMic, BsSend,
  BsCheck2, BsCheck2All, BsX, BsReply,
  BsCamera, BsFileEarmark
} from 'react-icons/bs';
import '../styles/chatWindow.css';

const ChatWindow = ({ onBack }) => {
  const { user } = useAuth();
  const { selectedChat, messages, setMessages, addMessage } = useChat();
  const { socket, onlineUsers, emitTyping, emitStopTyping, emitMessageRead } = useSocket();
  
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [typing, setTyping] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const otherUser = selectedChat?.users?.find(u => u._id !== user._id);
  const isOnline = otherUser && onlineUsers.has(otherUser._id);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('typing', ({ chatId, userName }) => {
      if (chatId === selectedChat?._id) setTyping(userName);
    });

    socket.on('stopTyping', (chatId) => {
      if (chatId === selectedChat?._id) setTyping(null);
    });

    socket.on('messagesRead', ({ chatId, userId }) => {
      if (chatId === selectedChat?._id) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          readBy: msg.readBy?.some(r => r.user === userId) 
            ? msg.readBy 
            : [...(msg.readBy || []), { user: userId }]
        })));
      }
    });

    return () => {
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('messagesRead');
    };
  }, [socket, selectedChat, setMessages]);

  // Mark messages as read
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      const unreadIds = messages
        .filter(m => m.sender._id !== user._id && !m.readBy?.some(r => r.user === user._id))
        .map(m => m._id);
      
      if (unreadIds.length > 0) {
        emitMessageRead(selectedChat._id, unreadIds);
      }
    }
  }, [messages, selectedChat, user._id, emitMessageRead]);

  const handleTyping = () => {
    emitTyping(selectedChat._id, user.name);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(selectedChat._id);
    }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const { data } = await api.post('/messages', {
        chatId: selectedChat._id,
        content: text.trim(),
        type: 'text',
        replyTo: replyTo?._id
      });

      addMessage(data);
      setText('');
      setReplyTo(null);
      setShowEmoji(false);
      emitStopTyping(selectedChat._id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/messages/upload', formData);
      
      await api.post('/messages', {
        chatId: selectedChat._id,
        content: '',
        type,
        file: uploadRes.data
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
    
    setShowAttach(false);
  };

  const formatMessageTime = (date) => format(new Date(date), 'HH:mm');

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = format(new Date(msg.createdAt), 'dd/MM/yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <BsArrowLeft />
            </button>
          )}
          <img 
            src={selectedChat.isGroup ? selectedChat.groupImage : otherUser?.avatar} 
            alt="" 
            className="avatar"
          />
          <div className="header-info">
            <h3>{selectedChat.isGroup ? selectedChat.name : otherUser?.name}</h3>
            <span className="status">
              {typing ? (
                <span className="typing">{typing} is typing...</span>
              ) : selectedChat.isGroup ? (
                `${selectedChat.users?.length} participants`
              ) : isOnline ? (
                'online'
              ) : otherUser?.lastSeen ? (
                `last seen ${format(new Date(otherUser.lastSeen), 'dd/MM HH:mm')}`
              ) : (
                'offline'
              )}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button><BsSearch /></button>
          <div className="menu-wrapper">
            <button onClick={() => setShowMenu(!showMenu)}>
              <BsThreeDotsVertical />
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <button>Contact info</button>
                <button>Mute notifications</button>
                <button>Clear messages</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-separator">
              <span>{date === format(new Date(), 'dd/MM/yyyy') ? 'Today' : date}</span>
            </div>
            
            {msgs.map((msg) => (
              <div 
                key={msg._id}
                className={`message ${msg.sender._id === user._id ? 'sent' : 'received'} ${msg.deleted ? 'deleted' : ''}`}
              >
                {/* Reply reference */}
                {msg.replyTo && (
                  <div className="reply-reference">
                    <span>{msg.replyTo.sender?.name}</span>
                    <p>{msg.replyTo.content || `📎 ${msg.replyTo.type}`}</p>
                  </div>
                )}

                {/* Sender name in groups */}
                {selectedChat.isGroup && msg.sender._id !== user._id && (
                  <span className="sender-name">{msg.sender.name}</span>
                )}

                {/* Content */}
                {msg.type === 'image' ? (
                  <img src={msg.file?.url} alt="" className="message-image" />
                ) : msg.type === 'file' ? (
                  <a href={msg.file?.url} download className="message-file">
                    <BsFileEarmark />
                    <span>{msg.file?.name}</span>
                  </a>
                ) : (
                  <p>{msg.content}</p>
                )}

                {/* Meta */}
                <div className="message-meta">
                  <span className="time">{formatMessageTime(msg.createdAt)}</span>
                  {msg.sender._id === user._id && (
                    <span className="status-icon">
                      {msg.readBy?.length > 1 ? (
                        <BsCheck2All className="read" />
                      ) : msg.deliveredTo?.length > 1 ? (
                        <BsCheck2All />
                      ) : (
                        <BsCheck2 />
                      )}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <button 
                  className="reply-btn"
                  onClick={() => setReplyTo(msg)}
                >
                  <BsReply />
                </button>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <span>Replying to {replyTo.sender?.name}</span>
            <p>{replyTo.content || `📎 ${replyTo.type}`}</p>
          </div>
          <button onClick={() => setReplyTo(null)}>
            <BsX />
          </button>
        </div>
      )}

      {/* Input */}
      <form className="message-input" onSubmit={sendMessage}>
        <div className="input-actions">
          <button type="button" onClick={() => setShowEmoji(!showEmoji)}>
            <BsEmojiSmile />
          </button>
          
          <div className="attach-wrapper">
            <button type="button" onClick={() => setShowAttach(!showAttach)}>
              <BsPaperclip />
            </button>
            {showAttach && (
              <div className="attach-menu">
                <label>
                  <BsCamera /> Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    hidden 
                    onChange={(e) => handleFileUpload(e, 'image')}
                  />
                </label>
                <label>
                  <BsFileEarmark /> Document
                  <input 
                    type="file" 
                    hidden 
                    onChange={(e) => handleFileUpload(e, 'file')}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
        />

        <button type="submit" className="send-btn" disabled={!text.trim()}>
          {text.trim() ? <BsSend /> : <BsMic />}
        </button>
      </form>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="emoji-picker">
          <EmojiPicker 
            onEmojiClick={(emoji) => setText(prev => prev + emoji.emoji)}
            theme="dark"
            width="100%"
            height={350}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;