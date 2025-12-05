import React, { createContext, useContext, useState, useMemo } from 'react';

// Simple UI-only RBAC role model
// Roles: admin, builder, approver, viewer
// Permissions are evaluated purely on the client for demo purposes.

const RoleContext = createContext(null);

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return ctx;
};

const ROLE_PERMISSIONS = {
  admin: [
    'manageWorkflows',
    'deleteWorkflows',
    'publishWorkflows',
    'archiveWorkflows',
    'createWorkflows',
    'duplicateWorkflows',
    'manageForms',
    'deleteForms',
    'duplicateForms',
    'accessAnalytics',
    'accessTasks',
    'accessApprovals',
    'accessImportExport',
    'accessGlobalSearch',
  ],
  builder: [
    'manageWorkflows',
    'createWorkflows',
    'duplicateWorkflows',
    'publishWorkflows',
    'manageForms',
    'duplicateForms',
    'accessAnalytics',
    'accessTasks',
    'accessApprovals',
    'accessImportExport',
    'accessGlobalSearch',
  ],
  approver: [
    'accessTasks',
    'accessApprovals',
    'accessAnalytics',
    'accessGlobalSearch',
  ],
  viewer: [
    'accessAnalytics',
    'accessGlobalSearch',
  ],
};

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('admin');

  const value = useMemo(() => {
    const permissions = ROLE_PERMISSIONS[currentRole] || [];

    const can = (permission) => permissions.includes(permission);

    return {
      currentRole,
      setCurrentRole,
      permissions,
      can,
    };
  }, [currentRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};
