import { useEffect, useRef, useState } from 'react'
import * as mapboxgl from 'mapbox-gl/esm';
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
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [-99.2270, 19.5969],
              },
            },
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [-99.2270, 19.5959],
              },
            },
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [-99.2269, 19.5970],
              },
              
            },
          ],
        },
      })

      map.addLayer({
        id: 'circle',
        type: 'circle',
        source: 'points',
        minzoom: 14,
        paint: {
            'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,1,
                    9,5,
                    20,6
            ],
          'circle-color': '#4264fb',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,0,
            10,0.5,
            15,1,
            17,2
          ],
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
            'fill-opacity': 0.2,
            'fill-outline-color': '#004080',
          },
        })

        map.addLayer({
            id: 'heat-zones',
            type: 'heatmap',
            source: 'points',
            paint: {
                'heatmap-intensity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,1,
                    9,2,
                    15,7
                ],

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

                'heatmap-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,2,
                    10,15,
                    19,40,
                    20,45
                ]
                },
            slot: 'top'
        });

        
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


function SidePanel(){
    return <>
        <div>
            <div className='sidePanelTitle'>
                <h1>Reportes</h1>
                <h2>dawd</h2>
            </div>
            
        </div>
    </>
}

export default function InteractiveMap() {
  return (
    <main className="interactive-map-layout">
      <section className="map-panel">
        <MapContainer />
      </section>

      <aside className="information-panel">
        <SidePanel/>
      </aside>
    </main>
  )
}
