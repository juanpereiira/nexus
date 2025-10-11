import { useState } from 'react';
import './ControlPanel.css';

function ControlPanel({ onSpawn }) {
  const [diameter, setDiameter] = useState(1);
  const [velocity, setVelocity] = useState(20);
  const [asteroidType, setAsteroidType] = useState('Stony');
  const [isLoading, setIsLoading] = useState(false);

  const handleLaunch = () => {
    setIsLoading(true); // Disable the button while simulating

    // Convert UI units (km, km/s) to MKS units (m, m/s) for the backend
    const payload = {
      diameter: Number(diameter) * 1000, // km to m
      velocity: Number(velocity) * 1000, // km/s to m/s
      // The backend uses a default density, but you could add it here if needed
    };

    // --- THIS IS THE REAL API CALL ---
    fetch('http://localhost:5000/simulate-impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Response from backend:", data);
      // Pass the necessary data to the parent component
      onSpawn({
        diameter: Number(diameter), // Pass original km value for visual scaling
        velocity: Number(velocity), // Pass original km/s value for visual speed
        asteroidType: asteroidType,
      });
      setIsLoading(false); // Re-enable the button
    })
    .catch(error => {
      console.error("Error calling backend:", error);
      alert("Simulation failed. Make sure the backend server is running and check the console for errors.");
      setIsLoading(false);
    });
  };

  return (
    <div className="control-panel-container">
      <h2>Asteroid Details</h2>
      <div className="control-group">
        <label htmlFor="asteroid-type">Asteroid Type</label>
        <select
          id="asteroid-type"
          className="dropdown-select"
          value={asteroidType}
          onChange={(e) => setAsteroidType(e.target.value)}>
          <option value="Stony">Stony (S-type)</option>
          <option value="Iron">Iron (M-type)</option>
          <option value="Carbonaceous">Carbonaceous (C-type)</option>
        </select>
      </div>
      <div className="control-group">
        <label htmlFor="diameter">Diameter: {Number(diameter).toFixed(1)} km</label>
        <input type="range" id="diameter" min="1" max="10" step="0.1" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
      </div>
      <div className="control-group">
        <label htmlFor="velocity">Initial Velocity: {velocity} km/s</label>
        <input type="range" id="velocity" min="1" max="20" step="1" value={velocity} onChange={(e) => setVelocity(e.target.value)} />
      </div>
      <button className="launch-button" onClick={handleLaunch} disabled={isLoading}>
        {isLoading ? 'SIMULATING...' : 'SPAWN ASTEROID'}
      </button>
    </div>
  );
}

export default ControlPanel;