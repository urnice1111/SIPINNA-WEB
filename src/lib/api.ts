const API_BASE_URL = import.meta.env.VITE_API_URL;

// Solo uno de email/number va lleno; el otro se manda explícitamente como null.
export type LoginPayload = {
  email: string | null;
  number: string | null;
  password: string;
};

export type RegisterCitizenPayload = {
  nombre: string;
  edad: number;
  genero: string;
  email: string;
  telefono: string;
  password: string;
};

export type SessionResponse = {
  name: string;
};

// La forma exacta del reporte la define el backend en POST /report.
export type CrearReportePayload = Record<string, unknown>;

// Detalle que devuelve GET /report/:zone_id (solo admin).
export type Report = {
  folio: string;
  description: string;
  latitude: number;
  longitude: number;
  children_quantity: number;
  work_type: string;
  created_at: string;
  suspicius_level: number;
  children_age: string;
  zone_name: string;
  citizen_name: string;
  last_state: string;
  state_changed_at: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    // La sesión vive en la cookie httpOnly "session_token"; el navegador
    // solo la manda/recibe si todas las peticiones incluyen credenciales.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? `Error ${response.status}`);
  }

  return data as T;
}

export const api = {
  login(payload: LoginPayload) {
    return request<SessionResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  me() {
    return request<SessionResponse>('/auth/me');
  },

  logout() {
    return request<unknown>('/auth/logout', { method: 'POST' });
  },

  registerCitizen(payload: RegisterCitizenPayload) {
    return request<unknown>('/auth/citizen', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  crearReporte(data: CrearReportePayload) {
    return request<unknown>('/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // zone acepta el UUID de la zona o el nombre del municipio.
  getReportsByZone(zone: string, signal?: AbortSignal) {
    return request<{ reports: Report[] | null }>(
      `/report/${encodeURIComponent(zone)}`,
      { signal },
    );
  },
};
