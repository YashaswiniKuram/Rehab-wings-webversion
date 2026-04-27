import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('player');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Patient Endpoints ──────────────────────────────────────────────────

export const registerPatient = (data) =>
  api.post('/patients/register', data);

export const loginPatient = (data) =>
  api.post('/patients/login', data);

export const setPassword = (data) =>
  api.post('/patients/set-password', data);

export const getPatientStats = (patientId) =>
  api.get(`/patients/${patientId}/stats`);

// ── Game Endpoints ─────────────────────────────────────────────────────

export const startGameSession = (patientId) =>
  api.post('/game/start', { patient_id: patientId });

export const endGameSession = (patientId, score, durationSeconds) =>
  api.post('/game/end', {
    patient_id: patientId,
    score,
    duration_seconds: durationSeconds,
  });

export const checkPlaytime = (patientId) =>
  api.get(`/game/check-playtime/${patientId}`);

// ── Leaderboard Endpoints ──────────────────────────────────────────────

export const getLeaderboard = (limit = 10) =>
  api.get(`/leaderboard?limit=${limit}`);

export const getSessionHistory = (patientId, limit = 20) =>
  api.get(`/leaderboard/sessions/${patientId}?limit=${limit}`);

export const getDailyStats = (limit = 14) =>
  api.get(`/leaderboard/daily?limit=${limit}`);

export default api;
