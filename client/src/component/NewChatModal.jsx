import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import api from '../services/api';
import { BsArrowLeft, BsSearch } from 'react-icons/bs';
import '../styles/modal.css';

const NewChatModal = ({ onClose }) => {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectChat, setChats } = useChat();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data } = await api.get('/users/contacts');
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
    setLoading(false);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const startChat = async (userId) => {
    try {
      const { data } = await api.post('/chats', { userId });
      setChats(prev => {
        const exists = prev.find(c => c._id === data._id);
        if (exists) return prev;
        return [data, ...prev];
      });
      selectChat(data);
      onClose();
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button onClick={onClose}>
            <BsArrowLeft />
          </button>
          <h2>New chat</h2>
        </div>

        <div className="search-box">
          <BsSearch />
          <input
            type="text"
            placeholder="Search name or phone number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading">Loading contacts...</div>
          ) : filteredContacts.length > 0 ? (
            <div className="contacts-list">
              {filteredContacts.map(contact => (
                <div 
                  key={contact._id} 
                  className="contact-item"
                  onClick={() => startChat(contact._id)}
                >
                  <img src={contact.avatar} alt={contact.name} />
                  <div className="contact-info">
                    <span className="name">{contact.name}</span>
                    <span className="about">{contact.about}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No contacts found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;