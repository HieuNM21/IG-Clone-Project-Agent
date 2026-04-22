import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { MiniChatProvider } from './context/MiniChatContext';
import { CallProvider } from './context/CallContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <MiniChatProvider>
            <CallProvider>
              <App />
            </CallProvider>
          </MiniChatProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
