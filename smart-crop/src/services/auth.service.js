
import api from '../utils/api.js' // used when USE_MOCK = false

// Configure mock mode via environment variable (default: true for development)
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const authService = {
  /**
   * login({ email, password })
   * - When USE_MOCK === true: accepts demo credentials OR any email with password length >= 4
   * - When USE_MOCK === false: calls /auth/login on your backend and returns resp.data
   */
  async login({ email = '', password = '' } = {}) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!USE_MOCK) {
      // Real backend path: ensure Flask returns { token, user }
      const resp = await api.post('/auth/login', { email, password });
      // Expect resp.data = { token, user }
      return resp.data;
    }

    // MOCK behavior for development
    const isDemo = email === 'user@example.com' && password === 'password';
    const isAnyValid = email.includes('@') && password.trim().length >= 4;

    if (!isDemo && !isAnyValid) {
      throw new Error('Invalid credentials');
    }

    // Return expected shape
    const token = `mock-token-${Date.now()}`;
    const user = {
      id: Date.now(),
      name: email.split('@')[0],
      email,
    };

    return { token, user };
  },

  async register({ name = '', email = '', password = '' } = {}) {
    if (!name || !email || !password) {
      throw new Error('Name, email and password are required');
    }

    if (!USE_MOCK) {
      const resp = await api.post('/auth/register', { name, email, password });
      return resp.data;
    }

    await new Promise((r) => setTimeout(r, 400));
    const token = `mock-token-${Date.now()}`;
    const user = { id: Date.now(), name, email };
    return { token, user };
  },

  async logout() {
    if (!USE_MOCK) {
      await api.post('/auth/logout');
    }
    return true;
  },
};

export default authService;
