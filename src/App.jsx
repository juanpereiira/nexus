import './App.css';
import ControlPanel from './components/ControlPanel';
import OrbitalView from './components/OrbitalView';

function App() {
  return (
    <div className="app-container">
      <div className="visualization-pane">
        <OrbitalView />
      </div>
      <ControlPanel />
    </div>
  );
}

export default App;