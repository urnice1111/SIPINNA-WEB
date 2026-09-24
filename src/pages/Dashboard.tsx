import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Report, UserType } from '../lib/api';
import {
  MONTHS,
  STATES,
  computeDashboardStats,
  formatCoordinates,
  formatRelativeDate,
} from '../lib/dashboardStats';
import {
  ColumnChart,
  DonutChart,
  HorizontalBarChart,
  LineChart,
} from '../components/DashboardCharts';

const USER_PHOTO = '/src/assets/manu.jpeg';
const USER_TYPE_LABELS: Record<UserType, string> = {
  administrador: 'Administrador',
  alimentador: 'Alimentador',
  citizen: 'Ciudadano',
};
const REPORTS_ZONE: string | undefined = import.meta.env.VITE_REPORTS_ZONE;
const MONTH_NUMBERS = MONTHS.map((_, i) => String(i + 1));
const MAP_PREVIEW_URL =
  'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/-99.2734,19.5645,11.5,0/400x200@2x' +
  `?access_token=${import.meta.env.VITE_MAP_BOX_TOKEN}`;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userTypeLabel = user ? USER_TYPE_LABELS[user.userType] ?? user.userType : '';
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(Boolean(REPORTS_ZONE));
  const [error, setError] = useState<string | null>(
    REPORTS_ZONE ? null : 'Falta configurar VITE_REPORTS_ZONE',
  );

  useEffect(() => {
    if (!REPORTS_ZONE) return;
    const abortController = new AbortController();

    api
      .getReportsByZone(REPORTS_ZONE, abortController.signal)
      // Go serializa un slice vacío como null.
      .then((data) => setReports(data.reports ?? []))
      .catch((err) => {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes');
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) setLoading(false);
      });

    return () => abortController.abort();
  }, []);

  const stats = useMemo(() => computeDashboardStats(reports), [reports]);
  const placeholder = loading ? '…' : '—';

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <main className="dashboard-page" aria-label="Panel de control">
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel--overview" aria-labelledby="kpi-states">
          <h2 id="kpi-states" className="dashboard-title">Reportes por estado</h2>
          <DonutChart
            segments={STATES.map((state) => ({
              label: state.label,
              value: stats.byState[state.key],
              color: state.color,
            }))}
            centerValue={stats.byState.concluido}
            centerLabel="concluidos"
          />
        </section>

        <section className="dashboard-panel dashboard-panel--kpi" aria-labelledby="kpi-today">
          <h2 id="kpi-today" className="dashboard-subtitle">Hoy</h2>
          <p className="dashboard-stat">
            <span className="dashboard-stat-value">{loading ? placeholder : stats.today}</span>
            <span>reportes</span>
          </p>
        </section>

        <Link
          to="/map"
          className="dashboard-panel dashboard-panel--shortcut dashboard-map-link"
          style={{ backgroundImage: `url(${MAP_PREVIEW_URL})` }}
        >
          <span>
            Mapa
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
            </svg>
          </span>
        </Link>

        <section className="dashboard-panel dashboard-profile" aria-label="Usuario">
          <img
            src={USER_PHOTO}
            alt={`Foto de ${user?.name || 'usuario'}`}
            className="dashboard-avatar"
          />
          <div className="dashboard-user-info">
            <span className="dashboard-user-type">{userTypeLabel}</span>
            <strong>{user?.name}</strong>
            <span className="dashboard-user-zone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {user?.zoneName || 'Sin zona asignada'}
            </span>
          </div>
          <button className="dashboard-logout" type="button" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h12" />
            </svg>
            Cerrar sesión
          </button>
        </section>

        <section className="dashboard-panel dashboard-panel--summary" aria-labelledby="kpi-top-zone">
          <h2 id="kpi-top-zone" className="dashboard-subtitle">Zona con más reportes</h2>
          <div className="dashboard-top-zone">
            <div>
              <strong className="dashboard-zone-name">{stats.topZone?.zone ?? placeholder}</strong>
              {stats.topZone && (
                <span className="dashboard-muted">
                  {formatCoordinates(stats.topZone.latitude, stats.topZone.longitude)}
                </span>
              )}
            </div>
            <p className="dashboard-stat">
              <span className="dashboard-stat-value">{stats.topZone?.count ?? placeholder}</span>
              <span>reportes</span>
            </p>
          </div>
        </section>

        <section className="dashboard-panel dashboard-panel--recent" aria-labelledby="kpi-recent">
          <div className="dashboard-panel-header">
            <h2 id="kpi-recent" className="dashboard-subtitle">Reportes recientes</h2>
          </div>
          {!loading && stats.recent.length === 0 && (
            <p className="dashboard-muted">No hay reportes todavía.</p>
          )}
          <ul className="dashboard-recent">
            {stats.recent.map((report) => (
              <li key={report.folio}>
                <span className="dashboard-recent-avatar" aria-hidden="true">
                  {initials(report.citizen_name || '?')}
                </span>
                <span className="dashboard-recent-who">
                  <strong>{report.citizen_name || 'Anónimo'}</strong>
                  <span className="dashboard-muted">{formatRelativeDate(report.created_at)}</span>
                </span>
                <span className="dashboard-recent-coords">
                  {formatCoordinates(report.latitude, report.longitude)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dashboard-panel dashboard-panel--chart" aria-labelledby="kpi-zones">
          <h2 id="kpi-zones" className="dashboard-subtitle">Reportes por zona</h2>
          <HorizontalBarChart
            items={stats.byZone.slice(0, 5).map((z) => ({ label: z.zone, value: z.count }))}
          />
        </section>

        <section className="dashboard-panel dashboard-panel--featured dashboard-charts" aria-label="Tendencias del año">
          <div>
            <h2 className="dashboard-subtitle">Número de reportes por mes</h2>
            <ColumnChart
              label="Reportes por mes"
              categories={MONTHS}
              series={[{ label: 'Reportes', color: '#2f4bc4', values: stats.perMonth }]}
            />
          </div>
          <div>
            <h2 className="dashboard-subtitle">Reportes verídicos / reportes falsos</h2>
            <ColumnChart
              label="Reportes verídicos y falsos por mes"
              categories={MONTH_NUMBERS}
              series={[
                { label: 'Verídicos', color: '#2f4bc4', values: stats.truthfulPerMonth },
                { label: 'Falsos', color: '#e8662c', values: stats.falsePerMonth },
              ]}
            />
          </div>
          <div>
            <h2 className="dashboard-subtitle">Reportes en revisión / completados</h2>
            <LineChart
              label="Reportes en revisión y completados por mes"
              categories={MONTH_NUMBERS}
              series={[
                { label: 'En revisión', color: '#2f4bc4', values: stats.inReviewPerMonth },
                { label: 'Completados', color: '#e8662c', values: stats.completedPerMonth },
              ]}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;