/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { toast } from 'react-hot-toast';

const SignalRContext = createContext(null);

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5012/api';
      // Hub URL is usually relative to the domain, without /api
      const hubUrl = API_URL.replace('/api', '') + '/hubs/tasks';

      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      newConnection.start()
        .then(() => {
          console.log('SignalR Connected');
          
          // Set up generic event listeners
          newConnection.on('TaskCreated', (task) => {
            toast.success(`Task Created: ${task.title}`);
          });

          newConnection.on('TaskUpdated', (task) => {
            toast.success(`Task Updated: ${task.title}`);
          });

          newConnection.on('TaskDeleted', (_data) => {
            toast.error('A task was deleted.');
          });

          newConnection.on('TaskAssigned', ({ _taskId, userId }) => {
            if (user && user.id === userId) {
              toast.success('You were assigned to a new task!');
            }
          });

          newConnection.on('TaskUnassigned', ({ _taskId, userId }) => {
            if (user && user.id === userId) {
              toast.error('You were unassigned from a task.');
            }
          });
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      setConnection(newConnection);

      return () => {
        if (newConnection) {
          newConnection.stop();
        }
      };
    }
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    if (connection && connection.state === signalR.HubConnectionState.Connected && activeWorkspace) {
      connection.invoke('JoinWorkspace', activeWorkspace.workspaceId)
        .catch(err => console.error('Error joining workspace:', err));
        
      return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
          connection.invoke('LeaveWorkspace', activeWorkspace.workspaceId)
            .catch(err => console.error('Error leaving workspace:', err));
        }
      };
    }
  }, [connection, activeWorkspace]);

  return (
    <SignalRContext.Provider value={{ connection }}>
      {children}
    </SignalRContext.Provider>
  );
};
