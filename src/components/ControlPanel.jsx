import { useState } from 'react';
import './ControlPanel.css';

function ControlPanel({ onSpawn }) {
  const [asteroidType, setAsteroidType] = useState('Stony');
  const [diameter, setDiameter] = useState(4.1);
  const [velocityChange, setVelocityChange] = useState(20);

  const handleSpawnClick = () => {
    if (onSpawn) {
      onSpawn({ diameter, velocityChange });
    }
  };

  return (
    <div className="control-panel-container">
      <h2>Mission Control</h2>
      
      {/* Asteroid Type Dropdown */}
      <div className="control-group">
        <label htmlFor="asteroid-type">Asteroid Type</label>
        <select
          id="asteroid-type"
          className="dropdown-select"
          value={asteroidType}
          onChange={(e) => setAsteroidType(e.target.value)}
        >
          <option value="Stony">Stony (e.g., S-type)</option>
          <option value="Iron">Iron (e.g., M-type)</option>
          <option value="Carbonaceous">Carbonaceous (e.g., C-type)</option>
        </select>
      </div>

      {/* Diameter Slider */}
      <div className="control-group">
        <label htmlFor="diameter">Diameter: {diameter} km</label>
        <input
          type="range"
          min="0.1"
          max="20"
          step="0.1"
          id="diameter"
          value={diameter}
          onChange={(e) => setDiameter(parseFloat(e.target.value))}
        />
      </div>

      {/* Velocity Change Slider */}
      <div className="control-group">
        <label htmlFor="velocity-change">Velocity Change: {velocityChange} km/s</label>
        <input
          type="range"
          min="1"
          max="40"
          step="1"
          id="velocity-change"
          value={velocityChange}
          onChange={(e) => setVelocityChange(parseFloat(e.target.value))}
        />
      </div>

      {/* Spawn Button */}
      <button className="launch-button" onClick={handleSpawnClick}>
        SPAWN METEOR
      </button>
    </div>
  );
}

export default ControlPanel;
