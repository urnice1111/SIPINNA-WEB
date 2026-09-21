const API_BASE_URL = 'http://localhost:3000';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterCitizenPayload = {
  nombre: string;
  edad: number;
  genero: string;
  email: string;
  telefono: string;
  password: string;
};

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Error ${response.status}`);
  }

  return data;
}

export function login(payload: LoginPayload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registerCitizen(payload: RegisterCitizenPayload) {
  return request('/auth/citizen', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}