import axios from 'axios';

// Use relative URL to leverage Vite proxy
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', error.response?.status, error.message);

    // If 401, clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login/register
      if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
        window.location.href = '/login';
      }
    }

    // Enrich error message if possible
    if (!error.response) {
      error.customMessage = 'Network error: Cannot reach the server. Please check if the backend is running.';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    // OAuth2 password flow requires form data with 'username' field
    // The backend accepts email as the username
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Exams API
export const examsAPI = {
  getAvailable: async () => {
    const response = await api.get('/exams/available');
    return response.data;
  },

  getExam: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  createExam: async (examData) => {
    const response = await api.post('/exams/create', examData);
    return response.data;
  },

  startExam: async (examId) => {
    const response = await api.post(`/exams/${examId}/start`);
    return response.data;
  },

  submitAnswer: async (submissionId, questionId, answer) => {
    const response = await api.post(`/exams/${submissionId}/answer`, {
      question_id: questionId,
      answer: answer,
    });
    return response.data;
  },

  finishExam: async (submissionId) => {
    const response = await api.post(`/exams/${submissionId}/finish`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getMyStats: async () => {
    const response = await api.get('/analytics/student/me');
    return response.data;
  },

  getExamStats: async (examId) => {
    const response = await api.get(`/analytics/exam/${examId}`);
    return response.data;
  },

  getTeacherDashboard: async () => {
    const response = await api.get('/analytics/dashboard/teacher');
    return response.data;
  },

  getAdminDashboard: async () => {
    const response = await api.get('/analytics/dashboard/admin');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  listUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/auth/users/${userId}/role?new_role=${role}`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  deleteExam: async (examId) => {
    const response = await api.delete(`/exams/${examId}`);
    return response.data;
  },
};

export default api;
