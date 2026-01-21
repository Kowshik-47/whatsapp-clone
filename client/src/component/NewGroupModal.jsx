import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import api from '../services/api';
import { BsArrowLeft, BsArrowRight, BsSearch, BsCheck, BsX, BsCamera } from 'react-icons/bs';
import '../styles/modal.css';

const NewGroupModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
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
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (contact) => {
    setSelected(prev => {
      const exists = prev.find(c => c._id === contact._id);
      if (exists) return prev.filter(c => c._id !== contact._id);
      return [...prev, contact];
    });
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length < 2) return;

    setLoading(true);
    try {
      const { data } = await api.post('/chats/group', {
        name: groupName,
        users: selected.map(s => s._id)
      });
      setChats(prev => [data, ...prev]);
      selectChat(data);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e => e.stopPropagation()}>
        {step === 1 ? (
          <>
            <div className="modal-header">
              <button onClick={onClose}>
                <BsArrowLeft />
              </button>
              <h2>Add group participants</h2>
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="selected-chips">
                {selected.map(s => (
                  <div key={s._id} className="chip">
                    <img src={s.avatar} alt={s.name} />
                    <span>{s.name}</span>
                    <button onClick={() => toggleSelect(s)}>
                      <BsX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="search-box">
              <BsSearch />
              <input
                type="text"
                placeholder="Search contacts"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="modal-content">
              <div className="contacts-list">
                {filteredContacts.map(contact => (
                  <div 
                    key={contact._id} 
                    className={`contact-item ${selected.find(s => s._id === contact._id) ? 'selected' : ''}`}
                    onClick={() => toggleSelect(contact)}
                  >
                    <img src={contact.avatar} alt={contact.name} />
                    <div className="contact-info">
                      <span className="name">{contact.name}</span>
                      <span className="about">{contact.about}</span>
                    </div>
                    {selected.find(s => s._id === contact._id) && (
                      <BsCheck className="check-icon" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selected.length >= 2 && (
              <button className="next-btn" onClick={() => setStep(2)}>
                <BsArrowRight />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="modal-header">
              <button onClick={() => setStep(1)}>
                <BsArrowLeft />
              </button>
              <h2>New group</h2>
            </div>

            <div className="modal-content group-info">
              <div className="group-avatar">
                <BsCamera />
              </div>

              <div className="group-name-input">
                <input
                  type="text"
                  placeholder="Group subject"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={25}
                />
              </div>

              <p className="participants-count">
                Participants: {selected.length}
              </p>

              <div className="participants-preview">
                {selected.map(s => (
                  <img key={s._id} src={s.avatar} alt={s.name} title={s.name} />
                ))}
              </div>
            </div>

            {groupName.trim() && (
              <button 
                className="next-btn create-btn" 
                onClick={createGroup}
                disabled={loading}
              >
                <BsCheck />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewGroupModal;