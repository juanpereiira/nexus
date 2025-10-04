import './App.css';
import ControlPanel from './components/ControlPanel';

function App() {
  return (
    <div className="app-container">
      <div className="visualization-pane">
        <h2>Visualization Pane</h2>
      </div>
      <ControlPanel /> {/* <-- USE THE COMPONENT HERE */}
    </div>
  );
}

export default App;