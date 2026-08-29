import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'

function App() {

  const mapRef = useRef() // This references the map for change it
  const mapContainerRef = useRef() // This references the map for display

  useEffect(() => {
    const MAP_BOX_API_KEY = import.meta.env.VITE_MAP_BOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      accessToken: MAP_BOX_API_KEY,
      container: mapContainerRef.current,
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

export default App