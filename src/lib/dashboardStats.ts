import type { Report } from './api';

export type StateKey =
  | 'registrado'
  | 'revision'
  | 'seguimiento'
  | 'canalizado'
  | 'concluido'
  | 'archivado'
  | 'cancelado'
  | 'reincidente';

// Colores validados para daltonismo en este orden, incluido el par
// Reincidente→Registrado donde se cierra la dona. Si se reordena, hay que revalidar.
export const STATES: { key: StateKey; label: string; color: string }[] = [
  { key: 'registrado', label: 'Registrado', color: '#2a78d6' },
  { key: 'revision', label: 'En revisión', color: '#eb6834' },
  { key: 'seguimiento', label: 'En seguimiento', color: '#4a3aa7' },
  { key: 'canalizado', label: 'Canalizado', color: '#1baf7a' },
  { key: 'concluido', label: 'Concluido', color: '#008300' },
  { key: 'archivado', label: 'Archivado', color: '#e87ba4' },
  { key: 'cancelado', label: 'Cancelado', color: '#eda100' },
  { key: 'reincidente', label: 'Reincidente', color: '#e34948' },
];

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// suspicius_level >= este valor se cuenta como reporte falso. El backend
// devuelve 0 cuando el LLM aún no analiza el reporte, así que esos cuentan como verídicos.
export const FALSE_REPORT_THRESHOLD = 0.5;

export type ZoneCount = { zone: string; count: number };

export type DashboardStats = {
  total: number;
  today: number;
  byState: Record<StateKey, number>;
  topZone: (ZoneCount & { latitude: number; longitude: number }) | null;
  byZone: ZoneCount[];
  recent: Report[];
  perMonth: number[];
  truthfulPerMonth: number[];
  falsePerMonth: number[];
  inReviewPerMonth: number[];
  completedPerMonth: number[];
};

// historial_estados.estado es texto libre; se normaliza para agrupar variantes
// como "En revisión", "en_revision" o "REVISION".
export function normalizeState(state: string | null | undefined): StateKey {
  const s = (state ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  if (s.includes('reincid')) return 'reincidente';
  if (s.includes('cancel')) return 'cancelado';
  if (s.includes('archiv')) return 'archivado';
  if (s.includes('revision')) return 'revision';
  if (s.includes('seguimiento')) return 'seguimiento';
  if (s.includes('canaliz')) return 'canalizado';
  if (s.includes('conclu') || s.includes('complet') || s.includes('cerrad')) return 'concluido';
  return 'registrado';
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function computeDashboardStats(reports: Report[], now = new Date()): DashboardStats {
  const byState: Record<StateKey, number> = {
    registrado: 0,
    revision: 0,
    seguimiento: 0,
    canalizado: 0,
    concluido: 0,
    archivado: 0,
    cancelado: 0,
    reincidente: 0,
  };
  const zones = new Map<string, { count: number; lat: number; lng: number }>();
  const emptyYear = () => Array<number>(12).fill(0);
  const perMonth = emptyYear();
  const truthfulPerMonth = emptyYear();
  const falsePerMonth = emptyYear();
  const inReviewPerMonth = emptyYear();
  const completedPerMonth = emptyYear();
  let today = 0;

  for (const report of reports) {
    const state = normalizeState(report.last_state);
    byState[state] += 1;

    const zoneName = report.zone_name || 'Sin zona';
    const zone = zones.get(zoneName) ?? { count: 0, lat: 0, lng: 0 };
    zone.count += 1;
    zone.lat += report.latitude;
    zone.lng += report.longitude;
    zones.set(zoneName, zone);

    const createdAt = new Date(report.created_at);
    if (isSameDay(createdAt, now)) today += 1;

    // Las gráficas mensuales solo muestran el año en curso.
    if (createdAt.getFullYear() !== now.getFullYear()) continue;
    const month = createdAt.getMonth();
    perMonth[month] += 1;
    if (report.suspicius_level >= FALSE_REPORT_THRESHOLD) falsePerMonth[month] += 1;
    else truthfulPerMonth[month] += 1;
    if (state === 'revision') inReviewPerMonth[month] += 1;
    if (state === 'concluido') completedPerMonth[month] += 1;
  }

  const byZone = [...zones.entries()]
    .map(([zone, { count }]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count);

  const topName = byZone[0]?.zone;
  const top = topName ? zones.get(topName) : undefined;

  return {
    total: reports.length,
    today,
    byState,
    topZone: top
      ? {
          zone: topName!,
          count: top.count,
          // Centroide simple de los reportes de la zona.
          latitude: top.lat / top.count,
          longitude: top.lng / top.count,
        }
      : null,
    byZone,
    recent: [...reports]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 6),
    perMonth,
    truthfulPerMonth,
    falsePerMonth,
    inReviewPerMonth,
    completedPerMonth,
  };
}

export function formatCoordinates(latitude: number, longitude: number) {
  const lat = `${Math.abs(latitude).toFixed(4)}${latitude >= 0 ? 'N' : 'S'}`;
  const lng = `${Math.abs(longitude).toFixed(4)}${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lng}`;
}

export function formatRelativeDate(value: string, now = new Date()) {
  const date = new Date(value);
  const time = date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);

  if (days === 0) return `Hoy, ${time}`;
  if (days === 1) return `Ayer, ${time}`;
  if (days === 2) return `Antier, ${time}`;
  return `${date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}, ${time}`;
}
