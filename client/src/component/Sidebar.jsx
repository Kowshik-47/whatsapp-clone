import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { format, isToday, isYesterday } from 'date-fns';
import { 
  BsChat, BsThreeDotsVertical, BsPeople, 
  BsSearch, BsFilter, BsCheck2All, BsCheck2 
} from 'react-icons/bs';
import '../styles/sidebar.css';

const Sidebar = ({ onProfileClick, onNewChat, onNewGroup }) => {
  const { user, logout } = useAuth();
  const { chats, selectedChat, selectChat, loading } = useChat();
  const { onlineUsers } = useSocket();
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const filteredChats = chats.filter(chat => {
    if (!search) return true;
    const name = chat.isGroup ? chat.name : getOtherUser(chat)?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const getOtherUser = (chat) => {
    return chat.users?.find(u => u._id !== user._id);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd/MM/yyyy');
  };

  const getLastMessage = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    if (chat.lastMessage.deleted) return '🚫 This message was deleted';
    
    const prefix = chat.lastMessage.sender?._id === user._id ? 'You: ' : '';
    const content = chat.lastMessage.type !== 'text' 
      ? `📎 ${chat.lastMessage.type}` 
      : chat.lastMessage.content;
    
    return prefix + (content?.substring(0, 30) + (content?.length > 30 ? '...' : ''));
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <img 
          src={user?.avatar} 
          alt={user?.name}
          className="avatar"
          onClick={onProfileClick}
        />
        <div className="header-actions">
          <button onClick={onNewGroup} title="New group">
            <BsPeople />
          </button>
          <button onClick={onNewChat} title="New chat">
            <BsChat />
          </button>
          <div className="menu-wrapper">
            <button onClick={() => setShowMenu(!showMenu)}>
              <BsThreeDotsVertical />
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <button onClick={() => { onProfileClick(); setShowMenu(false); }}>
                  Profile
                </button>
                <button onClick={() => { onNewGroup(); setShowMenu(false); }}>
                  New group
                </button>
                <button onClick={logout}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-box">
        <BsSearch />
        <input
          type="text"
          placeholder="Search or start new chat"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <BsFilter />
      </div>

      {/* Chat List */}
      <div className="chat-list">
        {loading ? (
          <div className="loading-chats">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="chat-skeleton" />
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map(chat => {
            const otherUser = getOtherUser(chat);
            const isOnline = otherUser && onlineUsers.has(otherUser._id);
            
            return (
              <div
                key={chat._id}
                className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                onClick={() => selectChat(chat)}
              >
                <div className="chat-avatar">
                  <img 
                    src={chat.isGroup ? chat.groupImage : otherUser?.avatar} 
                    alt="" 
                  />
                  {!chat.isGroup && isOnline && <span className="online-dot" />}
                </div>
                
                <div className="chat-info">
                  <div className="chat-top">
                    <span className="chat-name">
                      {chat.isGroup ? chat.name : otherUser?.name}
                    </span>
                    <span className="chat-time">
                      {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                    </span>
                  </div>
                  <div className="chat-bottom">
                    <span className="last-message">
                      {chat.lastMessage?.sender?._id === user._id && (
                        <span className="message-status">
                          {chat.lastMessage?.readBy?.length > 1 
                            ? <BsCheck2All className="read" /> 
                            : <BsCheck2 />
                          }
                        </span>
                      )}
                      {getLastMessage(chat)}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-chats">
            <p>No chats found</p>
            <button onClick={onNewChat}>Start a conversation</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;