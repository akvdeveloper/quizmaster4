import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuiz } from './QuizContext';

class SocketSimulator {
  private listeners: Record<string, Function[]> = {};
  private id: string;

  constructor() {
    this.id = Math.random().toString(36).substring(2, 15);
    
    window.addEventListener('storage', this.handleStorageEvent);
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key?.startsWith('socket:')) {
      try {
        const { eventName, data, senderId } = JSON.parse(event.newValue || '{}');
        
        if (senderId === this.id) return;
        
        if (this.listeners[eventName]) {
          this.listeners[eventName].forEach(callback => callback(data));
        }
      } catch (error) {
        console.error('Error parsing socket event:', error);
      }
    }
  };

  connect() {
    console.log('Socket simulator connected');
    return this;
  }

  on(eventName: string, callback: Function) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
    return this;
  }

  off(eventName: string, callback: Function) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }
    return this;
  }

  emit(eventName: string, data: any) {
    localStorage.setItem(`socket:${Date.now()}`, JSON.stringify({
      eventName,
      data,
      senderId: this.id,
      timestamp: Date.now()
    }));
    
    this.cleanupOldEvents();
    
    return this;
  }

  disconnect() {
    window.removeEventListener('storage', this.handleStorageEvent);
    this.listeners = {};
    console.log('Socket simulator disconnected');
  }

  private cleanupOldEvents() {
    const fiveSecondsAgo = Date.now() - 5000;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('socket:')) {
        try {
          const { timestamp } = JSON.parse(localStorage.getItem(key) || '{}');
          if (timestamp && timestamp < fiveSecondsAgo) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}

interface SocketContextType {
  socket: SocketSimulator | null;
  isConnected: boolean;
  joinRoom: (roomId: string, participantName: string) => void;
  leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<SocketSimulator | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { state, dispatch } = useQuiz();

  useEffect(() => {
    const socketInstance = new SocketSimulator().connect();
    setSocket(socketInstance);
    setIsConnected(true);

    socketInstance.on('quiz:start', (data) => {
      console.log('Quiz started:', data);
    });

    socketInstance.on('question:next', (data) => {
      console.log('Next question:', data);
    });

    socketInstance.on('participant:join', (data) => {
      console.log('Participant joined:', data);
      const { roomId, participant } = data;
      const session = state.sessions.find(s => s.id === roomId);
      if (session) {
        const updatedSession = {
          ...session,
          participants: [...session.participants, participant]
        };
        dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
      }
    });

    socketInstance.on('answer:submit', (data) => {
      console.log('Answer submitted:', data);
    });

    socketInstance.on('quiz:end', (data) => {
      console.log('Quiz ended:', data);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [dispatch, state.sessions]);

  const joinRoom = (roomId: string, participantName: string) => {
    if (socket && isConnected) {
      const participantId = Math.random().toString(36).substring(2, 15);
      
      socket.emit('room:join', {
        roomId,
        participant: {
          id: participantId,
          name: participantName
        }
      });
      
      return participantId;
    }
    return null;
  };

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('room:leave', { roomId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};