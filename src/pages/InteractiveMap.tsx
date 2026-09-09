import { useEffect, useRef, useState } from 'react'
import * as mapboxgl from 'mapbox-gl/esm'
import 'mapbox-gl/dist/mapbox-gl.css'
import './InteractiveMap.css'

type Report = {
  folio: string
  description: string
  latitude: number
  longitude: number
  children_quantity: number
  work_type: string
  created_at: string
  suspicius_level: number
  children_age: string
  zone_name: string
  citizen_name: string
  last_state: string
  state_changed_at: string
}

type CoordinatePair = [number, number]

type MapContainerProps = {
  reports: Report[]
  selectedReport: Report | null
  onSelectReport: (folio: string) => void
}

type SidePanelProps = {
  reports: Report[]
  selectedReportId: string | null
  loading: boolean
  error: string | null
  onSelectReport: (folio: string) => void
}

const INITIAL_CENTER: CoordinatePair = [-99.2734, 19.5645]
const INITIAL_ZOOM = 12.5
const REPORTS_SOURCE_ID = 'reports'
const REPORTS_HEATMAP_LAYER_ID = 'report-heat-zones'
const REPORTS_POINT_LAYER_ID = 'report-points'

function reportsToGeoJSON(reports: Report[]) {
  return {
    type: 'FeatureCollection' as const,
    features: reports.map((report) => ({
      type: 'Feature' as const,
      id: report.folio,
      properties: {
        folio: report.folio,
        description: report.description,
        suspiciousLevel: report.suspicius_level,
      },
      geometry: {
        type: 'Point' as const,
        // GeoJSON and Mapbox expect longitude first, then latitude.
        coordinates: [report.longitude, report.latitude] as CoordinatePair,
      },
    })),
  }
}

function MapContainer({ reports, selectedReport, onSelectReport }: MapContainerProps) {
  const [center, setCenter] = useState<CoordinatePair>(INITIAL_CENTER)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [boundaryCoordinateCount, setBoundaryCoordinateCount] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const onSelectReportRef = useRef(onSelectReport)

  useEffect(() => {
    onSelectReportRef.current = onSelectReport
  }, [onSelectReport])

  useEffect(() => {
    if (!mapContainerRef.current) return

    const abortController = new AbortController()
    const map = new mapboxgl.Map({
      accessToken: import.meta.env.VITE_MAP_BOX_TOKEN,
      container: mapContainerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    })

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      map.addSource(REPORTS_SOURCE_ID, {
        type: 'geojson',
        data: reportsToGeoJSON([]),
      })

      map.addLayer({
        id: REPORTS_HEATMAP_LAYER_ID,
        type: 'heatmap',
        source: REPORTS_SOURCE_ID,
        maxzoom: 17,
        paint: {
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 2, 15, 7],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33,102,172,0)',
            0.2,
            'rgb(103,169,207)',
            0.4,
            'rgb(209,229,240)',
            0.6,
            'rgb(253,219,199)',
            0.8,
            'rgb(239,138,98)',
            1,
            'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 10, 15, 17, 35],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 1, 17, 0],
        },
      })

      map.addLayer({
        id: REPORTS_POINT_LAYER_ID,
        type: 'circle',
        source: REPORTS_SOURCE_ID,
        minzoom: 13,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 5, 20, 9],
          'circle-color': '#4264fb',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.on('click', REPORTS_POINT_LAYER_ID, (event) => {
        const folio = event.features?.[0]?.toJSON().properties?.folio
        if (typeof folio === 'string') onSelectReportRef.current(folio)
      })

      map.on('mouseenter', REPORTS_POINT_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', REPORTS_POINT_LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
      })

      setMapLoaded(true)

      try {
        const response = await fetch(
          'https://gaia.inegi.org.mx/wscatgeo/v2/geo/mgem/15013',
          { signal: abortController.signal },
        )

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

        const data = await response.json()
        const feature = data.features?.[0]

        if (!feature || feature.geometry?.type !== 'MultiPolygon') {
          throw new Error('Atizapan MultiPolygon was not found')
        }

        setBoundaryCoordinateCount(feature.geometry.coordinates.flat(2).length)
        map.addSource('atizapan-boundary', { type: 'geojson', data: feature })
        map.addLayer(
          {
            id: 'atizapan-boundary',
            type: 'fill',
            source: 'atizapan-boundary',
            paint: {
              'fill-color': '#0080ff',
              'fill-opacity': 0.15,
              'fill-outline-color': '#004080',
            },
          },
          REPORTS_HEATMAP_LAYER_ID,
        )
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('Error fetching Atizapan data:', error)
      }
    })

    map.on('move', () => {
      const mapCenter = map.getCenter()
      setCenter([mapCenter.lng, mapCenter.lat])
      setZoom(map.getZoom())
    })

    return () => {
      abortController.abort()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const source = mapRef.current.getSource(REPORTS_SOURCE_ID) as mapboxgl.GeoJSONSource
    source.setData(reportsToGeoJSON(reports))
  }, [mapLoaded, reports])

  useEffect(() => {
    const map = mapRef.current
    if (!mapLoaded || !map) return

    map.setPaintProperty(REPORTS_POINT_LAYER_ID, 'circle-color', [
      'case',
      ['==', ['get', 'folio'], selectedReport?.folio ?? ''],
      '#ef4444',
      '#4264fb',
    ])
    map.setPaintProperty(REPORTS_POINT_LAYER_ID, 'circle-radius', [
      'case',
      ['==', ['get', 'folio'], selectedReport?.folio ?? ''],
      11,
      7,
    ])

    if (selectedReport) {
      map.flyTo({
        center: [selectedReport.longitude, selectedReport.latitude],
        zoom: 18,
        duration: 1200,
        essential: true,
      })
    }
  }, [mapLoaded, selectedReport])

  return (
    <>
      <div className="map-status">
        Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} |
        Zoom: {zoom.toFixed(2)} | Reports: {reports.length} | Boundary points:{' '}
        {boundaryCoordinateCount}
      </div>
      <div id="map-container" ref={mapContainerRef} />
    </>
  )
}

function SidePanel({
  reports,
  selectedReportId,
  loading,
  error,
  onSelectReport,
}: SidePanelProps) {
  return (
    <div className="reports-panel">
      <div className="sidePanelTitle">
        <h1>Reportes</h1>
        <span className="report-count">{reports.length}</span>
      </div>

      {loading && <p className="panel-message">Cargando reportes...</p>}
      {error && <p className="panel-message panel-message--error">{error}</p>}
      {!loading && !error && reports.length === 0 && (
        <p className="panel-message">No hay reportes disponibles.</p>
      )}

      <div className="report-list">
        {reports.map((report) => (
          <button
            key={report.folio}
            type="button"
            className={
              report.folio === selectedReportId
                ? 'report-card report-card--selected'
                : 'report-card'
            }
            onClick={() => onSelectReport(report.folio)}
          >
            <span className="report-card__heading">
              <strong>{report.folio}</strong>
              <span>{report.last_state}</span>
            </span>
            <span className="report-card__description">{report.description}</span>
            <span className="report-card__meta">
              {report.zone_name || 'Zona sin especificar'} · {report.work_type}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function InteractiveMap() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    async function loadReports() {
      setLoading(true)
      setError(null)

      try {
        const reportsUrl = import.meta.env.VITE_REPORTS_API_URL ?? '/api/reports'
        const response = await fetch(reportsUrl, { signal: abortController.signal })

        if (!response.ok) {
          throw new Error(`No se pudieron cargar los reportes (${response.status})`)
        }

        const reportsData: unknown = await response.json()
        if (
          typeof reportsData !== 'object' ||
          reportsData === null ||
          !('reports' in reportsData) ||
          !Array.isArray(reportsData.reports)
        ) {
          throw new Error('La respuesta no contiene una lista de reportes')
        }

        setReports(reportsData.reports as Report[])
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron cargar los reportes',
        )
      } finally {
        if (!abortController.signal.aborted) setLoading(false)
      }
    }

    void loadReports()
    return () => abortController.abort()
  }, [])

  const selectedReport =
    reports.find((report) => report.folio === selectedReportId) ?? null

  return (
    <main className="interactive-map-layout">
      <section className="map-panel">
        <MapContainer
          reports={reports}
          selectedReport={selectedReport}
          onSelectReport={setSelectedReportId}
        />
      </section>

      <aside className="information-panel">
        <SidePanel
          reports={reports}
          selectedReportId={selectedReportId}
          loading={loading}
          error={error}
          onSelectReport={setSelectedReportId}
        />
      </aside>
    </main>
  )
}
