import './App.css';
import { useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import OrbitalView from './components/OrbitalView';

function App() {
  const orbitalViewRef = useRef();

  function handleSpawn(simulationData) {
    if (orbitalViewRef.current) {
      orbitalViewRef.current.spawnAsteroid(simulationData);
    }
  }

  return (
    <div className="app-container">
      <div className="visualization-pane">
        <OrbitalView ref={orbitalViewRef} />
      </div>
      <ControlPanel onSpawn={handleSpawn} />
    </div>
  );
}

export default App;
