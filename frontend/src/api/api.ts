import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Group Services
export const groupService = {
  create: (data: any) => api.post('/groups', data),
  getAll: () => api.get('/groups'),
  getById: (groupId: string) => api.get(`/groups/${groupId}`),
  addMember: (groupId: string, data: any) =>
    api.post(`/groups/${groupId}/members`, data),
  getBalances: (groupId: string) =>
    api.get(`/groups/${groupId}/balances`),
};

// Expense & Receipt Services
export const expenseService = {
  add: (groupId: string, data: any) => api.post(`/groups/${groupId}/expenses`, data),
  getAll: (groupId: string) => api.get(`/groups/${groupId}/expenses`),
  scanReceipt: (file: File) => {
    const formData = new FormData();
    formData.append('receiptImage', file);
    return api.post('/receipts/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Notification Service
export const notificationService = {
  getAll: () => api.get('/notification'),
  markAsRead: (id: string) => api.patch(`/notification/${id}/read`),
};

export const inviteService = {
  send: (groupId, data) => api.post(`/invitation/${groupId}/send`, data),
  getPending: () => api.get('/invitation/pending'),
  getGroupPending: (groupId) =>api.get(`/invitation/group/${groupId}/pending`),
  accept: (token) => api.post(`/invitation/accept/${token}`),
};
export const settlementService = {
  create: (data: any) =>
    api.post('/settlement/create', data),

  requestPayment: (
    groupId: string,
    settlementId: string
  ) =>
    api.post(
      `/settlement/${groupId}/settlement-request`,
      { settlementId }
    ),

  settle: (settlementId: string) =>
    api.patch(`/settlement/${settlementId}/settle`),

  confirm: (settlementId: string) =>
    api.patch(`/settlement/${settlementId}/confirm`),
};