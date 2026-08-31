import { useRef, useEffect} from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import './InteractiveMap.css'

function MapContainer(){
    const mapRef = useRef() // This references the map for change it
    const mapContainerRef = useRef() // This references the map for display

    useEffect(() => {
        const MAP_BOX_API_KEY = import.meta.env.VITE_MAP_BOX_TOKEN;

        mapRef.current = new mapboxgl.Map({
        accessToken: MAP_BOX_API_KEY,
        container: mapContainerRef.current,
        center: [-99.2222, 19.5983],
        zoom: 18
        });

        return () => {
        mapRef.current.remove()
        }
    }, [])

    return (
        <>
        <div id='map-container' ref={mapContainerRef}/>
        </>
    )
}
  
export default function InteractiveMap(){
    return (
        <MapContainer/>
    );
        
    
}



