import { useState } from 'react'
import './App.css'
import "leaflet/dist/leaflet.css";
import Map from "./Map.jsx"



function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="h-screen w-screen mx-auto flex flex-col flex-1 justify-center items-center">
        <Map/>
        </div>
    </>
  )
}

export default App
