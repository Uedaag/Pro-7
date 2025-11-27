import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationModal } from '../components/NotificationModal';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationContextType {
  notify: (message: string, type: NotificationType) => void;
  close: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');

  const notify = useCallback((msg: string, type: NotificationType = 'info') => {
    setMessage(msg);
    setType(type);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, close }}>
      {children}
      {visible && (
        <NotificationModal 
          message={message} 
          type={type} 
          onClose={close} 
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};