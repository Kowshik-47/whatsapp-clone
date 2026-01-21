import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/chats');
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const { data } = await api.get(`/messages/${chatId}`);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const selectChat = useCallback((chat) => {
    setSelectedChat(chat);
    if (chat) {
      fetchMessages(chat._id);
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
    
    // Update chat's last message
    setChats(prev => prev.map(chat => 
      chat._id === message.chat 
        ? { ...chat, lastMessage: message, updatedAt: new Date() }
        : chat
    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
  }, []);

  const updateChatUnread = useCallback((chatId, reset = false) => {
    setChats(prev => prev.map(chat => 
      chat._id === chatId 
        ? { ...chat, unreadCount: reset ? 0 : (chat.unreadCount || 0) + 1 }
        : chat
    ));
  }, []);

  return (
    <ChatContext.Provider value={{
      chats,
      selectedChat,
      messages,
      loading,
      fetchChats,
      fetchMessages,
      selectChat,
      setChats,
      setMessages,
      addMessage,
      updateChatUnread
    }}>
      {children}
    </ChatContext.Provider>
  );
};