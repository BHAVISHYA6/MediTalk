import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,  // Important for cookie authentication
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const sendMessage = (senderId, receiverId, text, messageType = 'text', metadata = null) => {
  if (socket) {
    socket.emit('send_message', {
      senderId,
      receiverId,
      text,
      messageType,
      metadata,
    });
  }
};

export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.on('receive_message', callback);
  }
};

export const onMessageSent = (callback) => {
  if (socket) {
    socket.on('message_sent', callback);
  }
};

export const onUserOnline = (callback) => {
  if (socket) {
    socket.on('user_online', callback);
  }
};

export const onUserOffline = (callback) => {
  if (socket) {
    socket.on('user_offline', callback);
  }
};

export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('user_typing', callback);
  }
};

export const onUserStopTyping = (callback) => {
  if (socket) {
    socket.on('user_stop_typing', callback);
  }
};

export const emitUserTyping = (receiverId, senderName) => {
  if (socket) {
    socket.emit('user_typing', { receiverId, senderName });
  }
};

export const emitUserStopTyping = (receiverId) => {
  if (socket) {
    socket.emit('user_stop_typing', { receiverId });
  }
};
