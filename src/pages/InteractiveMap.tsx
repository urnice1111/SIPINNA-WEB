import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './InteractiveMap.css'

type CoordinatePair = [number, number]

const INITIAL_CENTER: CoordinatePair = [-99.2734, 19.5645]
const INITIAL_ZOOM = 12.5

function MapContainer() {
  const [center, setCenter] = useState<CoordinatePair>(INITIAL_CENTER)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [pairedCoordinates, setPairedCoordinates] = useState<CoordinatePair[]>([])

  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

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

    map.on('load', async () => {
      map.addSource('points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [-99.2222, 19.5983],
              },
            },
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [-99.1, 19.7],
              },
            },
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [-99.2267, 19.5969],
              },
            },
          ],
        },
      })

      map.addLayer({
        id: 'circle',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-color': '#4264fb',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.on('click', 'circle', (event) => {
        if (!event.features?.[0]) return

        map.flyTo({
          center: event.lngLat,
          zoom: 20,
        })
      })

      map.on('mouseenter', 'circle', () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'circle', () => {
        map.getCanvas().style.cursor = ''
      })

      try {
        const response = await fetch(
          'https://gaia.inegi.org.mx/wscatgeo/v2/geo/mgem/15013',
          { signal: abortController.signal },
        )

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const data = await response.json()
        const feature = data.features?.[0]

        if (!feature || feature.geometry?.type !== 'MultiPolygon') {
          throw new Error('Atizapan MultiPolygon was not found')
        }

        setPairedCoordinates(
          feature.geometry.coordinates.flat(2) as CoordinatePair[],
        )

        map.addSource('atizayork', {
          type: 'geojson',
          data: feature,
        })

        map.addLayer({
          id: 'atizayork',
          type: 'fill',
          source: 'atizayork',
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.5,
            'fill-outline-color': '#004080',
          },
        })
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

  return (
    <>
      <div className="sidebar">
        Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} |
        Zoom: {zoom.toFixed(2)} | Coordinates: {pairedCoordinates.length}
      </div>
      <div id="map-container" ref={mapContainerRef} />
    </>
  )
}

export default function InteractiveMap() {
  return (
    <main className="interactive-map-layout">
      <section className="map-panel">
        <MapContainer />
      </section>

      <aside className="information-panel">Contenido del panel</aside>
    </main>
  )
}
