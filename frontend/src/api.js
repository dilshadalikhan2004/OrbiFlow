const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
let BASE_URL = envUrl.replace(/\/+$/, '');
if (BASE_URL !== '' && !BASE_URL.endsWith('/api/v1')) {
    BASE_URL += '/api/v1';
}

export const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        let errorMessage = data.detail || data.message || (data.error && data.error.message) || 'API request failed';
        if (data.error && data.error.details) {
            errorMessage += ': ' + data.error.details.map(d => d.msg).join(', ');
        }
        throw new Error(errorMessage);
    }

    return data;
};

export const api = {
    login: (email, password) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),
    register: (user) => request('/auth/register', { method: 'POST', body: JSON.stringify(user) }),
    getProjects: (orgId = '') => request(`/projects/${orgId ? `?organization_id=${orgId}` : ''}`),
    createProject: (project, orgId = null) => request('/projects/', { method: 'POST', body: JSON.stringify(orgId ? { ...project, organization_id: orgId } : project) }),
    updateProject: (projectId, project) => request(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(project) }),
    deleteProject: (projectId) => request(`/projects/${projectId}`, { method: 'DELETE' }),
    getTasks: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.projectId) params.append('project_id', filters.projectId);
        if (filters.orgId) params.append('organization_id', filters.orgId);
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.assigneeId) params.append('assignee_id', filters.assigneeId);
        if (filters.search) params.append('search', filters.search);
        if (filters.limit != null) params.append('limit', filters.limit);
        if (filters.offset != null) params.append('offset', filters.offset);
        return request(`/tasks/?${params.toString()}`);
    },
    createTask: (task) => request('/tasks/', { method: 'POST', body: JSON.stringify(task) }),
    updateTask: (taskId, updateParams) => request(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(updateParams) }),
    assignTask: (taskId, assigneeId) => request(`/tasks/${taskId}/assign`, { method: 'POST', body: JSON.stringify({ assignee_id: assigneeId }) }),
    unassignTask: (taskId) => request(`/tasks/${taskId}/unassign`, { method: 'POST' }),
    getUsers: () => request('/users/'),

    // Organizations
    getOrganizations: () => request('/organizations/'),
    createOrganization: (org) => request('/organizations/', { method: 'POST', body: JSON.stringify(org) }),
    getOrganizationMembers: (orgId) => request(`/organizations/${orgId}/members`),
    inviteMember: (orgId, invite) => request(`/organizations/${orgId}/invite`, { method: 'POST', body: JSON.stringify(invite) }),

    // Activity
    getActivity: (orgId) => request(`/activity/?organization_id=${orgId}`),

    // Notifications
    getNotifications: () => request('/notifications/'),
    getUnreadCount: () => request('/notifications/unread-count'),
    markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
    deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

    // Analytics
    getAnalytics: (orgId) => request(`/analytics/dashboard?organization_id=${orgId}`),

    // AI Assistant
    parseTask: (prompt) => request('/ai/parse-task', { method: 'POST', body: JSON.stringify({ prompt }) }),
};
