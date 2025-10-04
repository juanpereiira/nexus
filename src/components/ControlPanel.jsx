// src/components/ControlPanel.jsx
import { useState } from 'react';
import './ControlPanel.css';

function ControlPanel() {
  const [asteroidType, setAsteroidType] = useState('Stony');
  const [diameter, setDiameter] = useState(100);
  const [velocityChange, setVelocityChange] = useState(20);

  // STEP 1: Create a handler function
  const handleLaunch = () => {
    // STEP 2: Log the current state to the console
    console.log("Launch parameters captured!");
    console.log({
      asteroidType: asteroidType,
      diameter: diameter,
      velocityChange: velocityChange,
    });
    // Later, you'll send this data to the backend instead of logging it.
  };

  return (
    <div className="control-panel-container">
      <h2>Mission Control</h2>

      {/* --- UI CHANGES --- */}
      {/* ADDED: Dropdown for Asteroid Type */}
      <div className="control-group">
        <label htmlFor="asteroid-type">Asteroid Type</label>
        <select
          id="asteroid-type"
          className="dropdown-select" // Added a class for styling
          value={asteroidType}
          onChange={(e) => setAsteroidType(e.target.value)}
        >
          <option value="Stony">Stony (e.g., S-type)</option>
          <option value="Iron">Iron (e.g., M-type)</option>
          <option value="Carbonaceous">Carbonaceous (e.g., C-type)</option>
        </select>
      </div>

      {/* ADDED: Slider for Diameter */}
      <div className="control-group">
        <label htmlFor="diameter">Diameter: {diameter} km</label>
        <input
          type="range"
          id="diameter"
          min="0"
          max="20"
          step="0.1"
          value={diameter}
          onChange={(e) => setDiameter(e.target.value)}
        />
      </div>

      <div className="control-group">
        <label htmlFor="velocity-change">Velocity Change (Δv): {velocityChange} km/s</label>
        <input
          type="range"
          id="velocity-change"
          min="1"
          max="40"
          step="1"
          value={velocityChange}
          onChange={(e) => setVelocityChange(e.target.value)}
        />
      </div>

      <button className="launch-button" onClick={handleLaunch}>
        SPAWN METEOR
      </button>
    </div>
  );
}

export default ControlPanel;
