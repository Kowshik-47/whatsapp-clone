import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import EmptyChat from '../components/EmptyChat';
import ProfilePanel from '../components/ProfilePanel';
import NewChatModal from '../components/NewChatModal';
import NewGroupModal from '../components/NewGroupModal';
import '../styles/home.css';

const Home = () => {
  const { selectedChat, fetchChats, addMessage, updateChatUnread, selectChat } = useChat();
  const { socket, joinChat, leaveChat } = useSocket();
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchChats();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchChats]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (message) => {
      addMessage(message);
      if (selectedChat?._id !== message.chat) {
        updateChatUnread(message.chat);
      }
    });

    return () => {
      socket.off('newMessage');
    };
  }, [socket, selectedChat, addMessage, updateChatUnread]);

  // Join/leave chat rooms
  useEffect(() => {
    if (selectedChat) {
      joinChat(selectedChat._id);
      updateChatUnread(selectedChat._id, true);
    }
    return () => {
      if (selectedChat) leaveChat(selectedChat._id);
    };
  }, [selectedChat, joinChat, leaveChat, updateChatUnread]);

  const handleBack = () => selectChat(null);

  return (
    <div className="home">
      {/* Profile Panel */}
      {showProfile && (
        <ProfilePanel onClose={() => setShowProfile(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${isMobile && selectedChat ? 'hidden' : ''}`}>
        <Sidebar
          onProfileClick={() => setShowProfile(true)}
          onNewChat={() => setShowNewChat(true)}
          onNewGroup={() => setShowNewGroup(true)}
        />
      </div>

      {/* Chat Window */}
      <div className={`chat-container ${isMobile && !selectedChat ? 'hidden' : ''}`}>
        {selectedChat ? (
          <ChatWindow onBack={isMobile ? handleBack : null} />
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Modals */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </div>
  );
};

export default Home;