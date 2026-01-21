import React from 'react';
import { BsWhatsapp, BsLock } from 'react-icons/bs';
import '../styles/emptyChat.css';

const EmptyChat = () => {
  return (
    <div className="empty-chat">
      <div className="content">
        <div className="icon-container">
          <BsWhatsapp />
        </div>
        <h1>WhatsApp Web</h1>
        <p>
          Send and receive messages without keeping your phone online.
          <br />
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>
      </div>
      <div className="footer">
        <BsLock />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};

export default EmptyChat;