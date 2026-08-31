import { useRef, useEffect, useState} from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import './InteractiveMap.css'

function MapContainer(){

    /*
        I know the error is for the type but change for later escalation
    */

    const INITIAL_CENTER = [
        -99.2222, 19.5983
    ]

    const INITIAL_ZOOM = 14
    
    const [center, setCenter] = useState(INITIAL_CENTER)
    const [zoom, setZoom] = useState(INITIAL_ZOOM)

    const mapRef = useRef() // This references the map for change it
    const mapContainerRef = useRef() // This references the map for display

    useEffect(() => {
        const MAP_BOX_API_KEY = import.meta.env.VITE_MAP_BOX_TOKEN;

        mapRef.current = new mapboxgl.Map({
        accessToken: MAP_BOX_API_KEY,
        container: mapContainerRef.current,
        center: center,
        zoom: zoom
        });

        mapRef.current.on('load', () => {
            mapRef.current.addSource('points', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'Point',
                                coordinates: [-99.2222, 19.5983]
                            }
                        },
                        {
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'Point',
                                coordinates: [-99.1, 19.7]
                            }
                        },

                    ]


                }
            });
            mapRef.current.addLayer({
                id: 'circle',
                type: 'circle',
                source: 'points',
                paint: {
                    'circle-color': '#4264fb',
                    'circle-radius': 8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
            }});
            mapRef.current.on('click', 'circle', (e) => {
                mapRef.current.flyTo({
                    center: e.features[0].geometry.coordinates,
                    zoom: 20
                })
            });
            mapRef.current.on('mouseenter', 'circle', () => {
                mapRef.current.getCanvas().style.cursor = 'pointer';
            });

            mapRef.current.on('mouseleave', 'circle', () => {
                mapRef.current.getCanvas().style.cursor = '';
            });
        })
        
        

        mapRef.current.on('move', () => {
            // get the current center coordinates and zoom level from the map
            const mapCenter = mapRef.current.getCenter()
            const mapZoom = mapRef.current.getZoom()
        
            // update state
            setCenter([ mapCenter.lng, mapCenter.lat ])
            setZoom(mapZoom)
        })

        return () => {
            mapRef.current.remove()
        }
    }, [])

    return (
        <>
        <div className="sidebar">
            Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
        </div>
        <div id='map-container' ref={mapContainerRef}/>
        </>
    )
}
  
export default function InteractiveMap(){
    return <>
        <MapContainer/>
    </>
        
    
}



