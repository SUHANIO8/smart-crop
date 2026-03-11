import api from '../utils/api.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const authService = {
  async login({ email = '', password = '' } = {}) {
    if (!email || !password) throw new Error('Email and password are required');

    if (!USE_MOCK) {
      const resp = await api.post('/auth/login', { email, password });
      return resp.data;
    }

    const isDemo = email === 'user@example.com' && password === 'password';
    const isAnyValid = email.includes('@') && password.trim().length >= 4;
    if (!isDemo && !isAnyValid) throw new Error('Invalid credentials');

    return {
      token: `mock-token-${Date.now()}`,
      user: { id: Date.now(), name: email.split('@')[0], email },
    };
  },

  async register({ name = '', email = '', password = '' } = {}) {
    if (!name || !email || !password) throw new Error('Name, email and password are required');

    if (!USE_MOCK) {
      const resp = await api.post('/auth/register', { name, email, password });
      return resp.data;
    }

    await new Promise((r) => setTimeout(r, 400));
    return {
      token: `mock-token-${Date.now()}`,
      user: { id: Date.now(), name, email },
    };
  },

  async logout() {
    if (!USE_MOCK) await api.post('/auth/logout');
    return true;
  },
};

export default authService;