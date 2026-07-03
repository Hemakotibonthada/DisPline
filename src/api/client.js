// Thin client for the Express backend. JWT is kept in localStorage and attached
// to every request. All methods throw ApiError on a non-2xx response.

const TOKEN_KEY = 'des.token.v1';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is it running?', 0);
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  return data;
}

export const api = {
  health: () => req('GET', '/health'),
  register: (body) => req('POST', '/auth/register', body),
  login: (body) => req('POST', '/auth/login', body),
  me: () => req('GET', '/auth/me'),
  updateProfile: (body) => req('PATCH', '/auth/profile', body),

  getState: () => req('GET', '/state'),
  putState: (body) => req('PUT', '/state', body),

  searchUsers: (q) => req('GET', `/users/search?q=${encodeURIComponent(q)}`),
  sendInvite: (identifier) => req('POST', '/invites', { identifier }),
  invites: () => req('GET', '/invites'),
  acceptInvite: (id) => req('POST', `/invites/${id}/accept`),
  declineInvite: (id) => req('POST', `/invites/${id}/decline`),
  cancelInvite: (id) => req('DELETE', `/invites/${id}`),

  friends: () => req('GET', '/friends'),
  unfriend: (id) => req('DELETE', `/friends/${id}`),
  friendProgress: (id) => req('GET', `/friends/${id}/progress`),
  leaderboard: () => req('GET', '/leaderboard'),
};
