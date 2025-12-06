import React, { createContext, useContext, useEffect, useState } from 'react';

const WorkspaceContext = createContext(null);

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${BACKEND_URL}/api/workspaces`);
        if (!res.ok) {
          throw new Error(`Failed to load workspaces: ${res.status}`);
        }
        const data = await res.json();
        const list = data.workspaces || [];
        setWorkspaces(list);
        if (!currentWorkspace && list.length > 0) {
          setCurrentWorkspace(list[0]);
        }
      } catch (err) {
        console.error('Failed to load workspaces', err);
        setError(err.message || 'Failed to load workspaces');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const value = {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    loading,
    error,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
