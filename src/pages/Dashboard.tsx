import './Dashboard.css';

const USER_PHOTO = '/src/assets/manu.jpeg';
const USER_NAME = 'José Manuel Bañuelos';
const USER_TYPE = 'Admin';

function Dashboard() {
  return (
    <main className="dashboard-page" aria-label="Panel de control">
      <div className="dashboard-grid">
        <div className="dashboard-panel dashboard-panel--overview" />
        <div className="dashboard-panel dashboard-panel--kpi" />
        <div className="dashboard-panel dashboard-panel--shortcut" />

        <section className="dashboard-panel dashboard-profile" aria-label="Usuario">
          <div className="dashboard-profile-header">
            <span>{USER_TYPE}</span>
            <button className="dashboard-logout" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h12" />
              </svg>
              Cerrar sesión
            </button>
          </div>
          <div className="dashboard-user">
            <img
              src={USER_PHOTO}
              alt="Foto del administrador"
              className="dashboard-avatar"
            />
            <strong>{USER_NAME}</strong>
          </div>
        </section>

        <div className="dashboard-panel dashboard-panel--summary" />
        <div className="dashboard-panel dashboard-panel--recent" />
        <div className="dashboard-panel dashboard-panel--chart" />
        <div className="dashboard-panel dashboard-panel--featured" />
      </div>
    </main>
  );
}

export default Dashboard;