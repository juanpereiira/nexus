import { useRef, useState } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';
import OrbitalView from './components/OrbitalView';

function App() {
  const globeRef = useRef(null);
  const [timeScale, setTimeScale] = useState(1);

  const handleSpawnMeteor = (simulationData) => {
    if (globeRef.current) {
      globeRef.current.spawnAsteroid(simulationData);
    }
  };

  return (
    <div className="app-container">
      <div className="visualization-pane">
        <OrbitalView ref={globeRef} timeScale={timeScale} />
      </div>
      <ControlPanel 
        onSpawn={handleSpawnMeteor} 
        onTimeScaleChange={setTimeScale} 
      />
    </div>
  );
}

export default App;