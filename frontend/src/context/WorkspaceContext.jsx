/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => localStorage.getItem('activeWorkspaceId') || '');
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchWorkspaces();
        } else {
            setOrganizations([]);
            setActiveWorkspaceId('');
        }
    }, [isAuthenticated]);

    const fetchWorkspaces = async () => {
        setLoadingWorkspaces(true);
        try {
            const orgs = await api.getOrganizations();
            setOrganizations(orgs);

            // Set default active if not set
            if (orgs.length > 0) {
                const currentStr = localStorage.getItem('activeWorkspaceId');
                if (!currentStr || !orgs.find(o => o.id === currentStr)) {
                    setActiveWorkspaceId(orgs[0].id);
                    localStorage.setItem('activeWorkspaceId', orgs[0].id);
                }
            } else {
                setActiveWorkspaceId('');
                localStorage.removeItem('activeWorkspaceId');
            }
        } catch (err) {
            console.error('Failed to fetch orgs', err);
        } finally {
            setLoadingWorkspaces(false);
        }
    };

    const switchWorkspace = (orgId) => {
        setActiveWorkspaceId(orgId);
        if (orgId) {
            localStorage.setItem('activeWorkspaceId', orgId);
        } else {
            localStorage.removeItem('activeWorkspaceId');
        }
    };

    const addWorkspace = (org) => {
        setOrganizations(prev => [...prev, org]);
        if (!activeWorkspaceId) {
            switchWorkspace(org.id);
        }
    };

    return (
        <WorkspaceContext.Provider value={{
            organizations,
            activeWorkspaceId,
            switchWorkspace,
            loadingWorkspaces,
            refreshWorkspaces: fetchWorkspaces,
            addWorkspace
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => useContext(WorkspaceContext);
