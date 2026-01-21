import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BsArrowLeft, BsCamera, BsPencil, BsCheck } from 'react-icons/bs';
import '../styles/profilePanel.css';

const ProfilePanel = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');

  const handleSave = async (field) => {
    try {
      const data = field === 'name' ? { name } : { about };
      const res = await api.put('/users/profile', data);
      updateUser(res.data);
      setEditing(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/messages/upload', formData);
      const res = await api.put('/users/profile', { avatar: uploadRes.data.url });
      updateUser(res.data);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  return (
    <div className="profile-panel">
      <div className="panel-header">
        <button onClick={onClose}>
          <BsArrowLeft />
        </button>
        <h2>Profile</h2>
      </div>

      <div className="panel-content">
        {/* Avatar */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img src={user?.avatar} alt={user?.name} />
            <label className="avatar-overlay">
              <BsCamera />
              <span>Change profile photo</span>
              <input 
                type="file" 
                accept="image/*" 
                hidden 
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </div>

        {/* Name */}
        <div className="info-section">
          <label>Your name</label>
          {editing === 'name' ? (
            <div className="edit-field">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
              />
              <button onClick={() => handleSave('name')}>
                <BsCheck />
              </button>
            </div>
          ) : (
            <div className="field-value">
              <span>{user?.name}</span>
              <button onClick={() => setEditing('name')}>
                <BsPencil />
              </button>
            </div>
          )}
          <p className="hint">
            This is not your username or pin. This name will be visible to your WhatsApp contacts.
          </p>
        </div>

        {/* About */}
        <div className="info-section">
          <label>About</label>
          {editing === 'about' ? (
            <div className="edit-field">
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={139}
              />
              <button onClick={() => handleSave('about')}>
                <BsCheck />
              </button>
            </div>
          ) : (
            <div className="field-value">
              <span>{user?.about}</span>
              <button onClick={() => setEditing('about')}>
                <BsPencil />
              </button>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="info-section">
          <label>Phone</label>
          <div className="field-value">
            <span>{user?.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;