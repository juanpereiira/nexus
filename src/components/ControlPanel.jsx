import { useState } from 'react';
import './ControlPanel.css';

function ControlPanel({ onSpawn }) {
  const [diameter, setDiameter] = useState(4.1);
  const [velocity, setVelocity] = useState(5);
  const [asteroidType, setAsteroidType] = useState('Stony');

 const handleLaunch = () => {
    // We are now faking the backend call for the demo
    console.log("Faking backend call for live demo...");

    // This is an example of what your backend might return
    const fakeBackendResult = {
      impact_effects: {
        crater_diameter_m_approx: 4000, // This will create a 4km crater
      },
      input_params: {
        diameter_m: 2000, // Corresponds to a 2km asteroid
        velocity_m_s: 15000,
        asteroidType: asteroidType,
      }
    };
    onSpawn(fakeBackendResult);
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
        <input type="range" id="diameter" min="0.1" max="10" step="0.1" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
      </div>
      <div className="control-group">
        <label htmlFor="velocity">Initial Velocity: {velocity} km/s</label>
        <input type="range" id="velocity" min="1" max="20" step="1" value={velocity} onChange={(e) => setVelocity(e.target.value)} />
      </div>
      <button className="launch-button" onClick={handleLaunch}>
        SPAWN ASTEROID
      </button>
    </div>
  );
}

export default ControlPanel;