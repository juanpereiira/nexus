import React, { useRef, useState, useCallback } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';
import OrbitalView from './components/OrbitalView';

// From Code 1: Maps the asteroid type string to a physical density for the backend.
const ASTEROID_DENSITIES = {
  Stony: 3000,
  Iron: 7800,
  Carbonaceous: 1800,
};

function App() {
  const orbitalViewRef = useRef(null);
  // From Code 2: Manages the visual simulation speed.
  const [timeScale, setTimeScale] = useState(1);

  /**
   * This is the combined function. It takes user input, calls the backend,
   * and then uses the results to drive the frontend simulation.
   */
  const handleSpawn = useCallback(async ({ asteroidType, diameter, velocity }) => {
    try {
      // --- Part 1: Logic from Code 1 (Backend Communication) ---
      
      // Convert UI units (km, km/s) to MKS units (m, m/s) required by the backend.
      const diameter_m = diameter * 1000;
      const velocity_m_s = velocity * 1000;
      const density = ASTEROID_DENSITIES[asteroidType] || ASTEROID_DENSITIES.Stony;
      
      // Define a fixed target for the backend calculation.
      const impactLocation = { lat: 9.9312, lon: 76.2673 }; // Kochi, India

      // Call the Python backend API.
      const response = await fetch('https://astro-impact.onrender.com/simulate-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diameter: diameter_m,
          velocity: velocity_m_s,
          density: density,
          angle: 45, // Assuming a 45-degree impact angle
          location: impactLocation,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend HTTP error! Status: ${response.status}`);
      }

      const backendResult = await response.json();
      console.log('Backend Simulation Results:', backendResult);

      // --- Part 2: Logic from Code 2 (Frontend Visualization) ---

      // Now, use the user's original inputs to start the visual simulation.
      if (orbitalViewRef.current) {
        orbitalViewRef.current.spawnAsteroid({
          diameter: diameter, // Use original km value for visual scaling
          velocity: velocity, // Use original km/s value for visual speed
          asteroidType: asteroidType, // Pass the type for color
          // You can also pass backend data if needed, e.g., for crater size:
          // craterRadius: backendResult.impact_effects.crater_diameter_m_approx / 1000,
        });
      }

    } catch (error) {
      console.error('Full Impact Simulation Failed:', error);
      alert("Simulation failed. Make sure the backend server is running and check the console for errors.");
    }
  }, []); // useCallback ensures this function doesn't change on re-renders.

  return (
    <div className="app-container">
      {/* The main 3D visualization pane, receiving the timeScale */}
      <div className="visualization-pane">
        <OrbitalView ref={orbitalViewRef} timeScale={timeScale} />
      </div>

      {/* The control panel, which triggers the spawn and changes the timeScale */}
      <ControlPanel 
        onSpawn={handleSpawn} 
        onTimeScaleChange={setTimeScale} 
      />
    </div>
  );
}

export default App;