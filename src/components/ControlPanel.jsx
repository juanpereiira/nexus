import { useState } from 'react';
import './ControlPanel.css';

function ControlPanel({ onSpawn }) {
  const [diameter, setDiameter] = useState(4.1);
  const [velocity, setVelocity] = useState(5);

  const handleLaunch = () => {
    const simulationData = {
      diameter: Number(diameter),
      velocity: Number(velocity),
    };
    onSpawn(simulationData);
  };

  return (
    <div className="control-panel-container">
      <h2>Mission Control</h2>
      
      <div className="control-group">
        <label htmlFor="diameter">Diameter: {Number(diameter).toFixed(1)} km</label>
        <input type="range" id="diameter" min="0.1" max="10" step="0.1" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
      </div>
      <div className="control-group">
        <label htmlFor="velocity">Initial Velocity: {velocity} km/s</label>
        <input type="range" id="velocity" min="1" max="20" step="1" value={velocity} onChange={(e) => setVelocity(e.target.value)} />
      </div>
      <button className="launch-button" onClick={handleLaunch}>
        SPAWN METEOR
      </button>
    </div>
  );
}

export default ControlPanel;