// client/src/config/api.ts
export const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  'http://localhost:5000/api'
).replace(/\/$/, '');

export const SERVER_ORIGIN = (
  (import.meta as any).env?.VITE_SERVER_ORIGIN ||
  (import.meta as any).env?.VITE_SERVER_URL ||
  API_BASE_URL.replace(/\/api$/, '')
).replace(/\/$/, '');
