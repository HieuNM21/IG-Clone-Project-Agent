import { createContext, useContext, useState, useCallback } from 'react';

const MiniChatContext = createContext(null);

export const useMiniChat = () => {
  const context = useContext(MiniChatContext);
  if (!context) throw new Error('useMiniChat must be used within MiniChatProvider');
  return context;
};

export const MiniChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null); // { type: 'user'|'group', data: {...} }

  const openChat = useCallback((conversation = null) => {
    setActiveConversation(conversation);
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setActiveConversation(null);
    setIsMinimized(false);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restoreChat = useCallback(() => {
    setIsMinimized(false);
  }, []);

  return (
    <MiniChatContext.Provider
      value={{
        isOpen,
        isMinimized,
        activeConversation,
        openChat,
        closeChat,
        minimizeChat,
        restoreChat,
      }}
    >
      {children}
    </MiniChatContext.Provider>
  );
};
