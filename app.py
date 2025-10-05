import requests
import math
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- Configuration & Constants ---

NASA_API_KEY = '3glRuoKrfy8UYozYOAcypN4f5vH7AvaRYLKPizC9'
MEGATON_JOULES = 4.184e15  # Conversion factor: 1 Megaton of TNT equivalent energy in Joules
EARTH_GRAVITY = 9.8       # m/s²
TARGET_DENSITY = 3000     # kg/m³ for target earth crust (typical rock density)
CRATER_COEFFICIENT = 1.5  # Adjusted scaling coefficient for visual demo/approximation

# --- 1. Data Fetching ---

def fetch_neo_data():
    """Fetches Near Earth Object (NEO) browse data from the NASA API."""
    url = f'https://api.nasa.gov/neo/rest/v1/neo/browse?api_key={NASA_API_KEY}'
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"NASA API Error: Status {response.status_code}")
            return {"error": f"Failed to fetch data from NASA NEO API. Status Code: {response.status_code}"}
    except requests.exceptions.RequestException as e:
        print(f"Network Request Failed: {e}")
        return {"error": f"Network request failed: {e}"}

# --- 2. Simulation Physics Functions (MKS Units) ---

def calculate_kinetic_energy(mass, velocity):
    """Returns kinetic energy in Joules (J). E = 0.5 * m * v^2"""
    return 0.5 * mass * velocity ** 2

def estimate_mass(diameter, density=TARGET_DENSITY):
    """Estimates asteroid mass (kg) assuming a sphere."""
    radius = diameter / 2
    # Volume of a sphere: V = (4/3) * pi * r³
    volume = (4/3) * math.pi * radius**3
    return volume * density

def estimate_crater_diameter(energy):
    """Estimates final crater diameter (meters) using simplified scaling."""
    if energy <= 0:
        return 0
    # D_final ∝ C * (E / (g * rho_target))^(1/4) - Simplified scaling law
    return CRATER_COEFFICIENT * ((energy / (EARTH_GRAVITY * TARGET_DENSITY)) ** 0.25)

def estimate_seismic_magnitude(energy):
    """Estimates the local seismic magnitude (Richter) from energy (Joules)."""
    if energy <= 0:
        return 0
    # Formula based on energy-magnitude relationships: M ≈ (2/3) * log10(E) - 3.2
    magnitude = (2/3) * math.log10(energy) - 3.2
    return round(magnitude, 2)

def is_ocean_impact(location):
    """Placeholder: Determines if the impact location is over water."""
    # This function needs logic (e.g., using geographical data/API) for a real-world check.
    if location and location.get('lat') is not None:
        return False  # Currently always land in this simplified demo
    return False

# --- 3. Flask Application Setup and Routes ---

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

@app.route('/')
def home():
    """Simple homepage endpoint."""
    return jsonify({"message": "ImpactViz Backend is running! Access /asteroids for data, POST to /simulate-impact."})

@app.route('/asteroids', methods=['GET'])
def asteroids():
    """API endpoint to fetch and serve NASA NEO browse data."""
    data = fetch_neo_data()
    if "error" in data:
        return jsonify(data), 500
    return jsonify(data)

@app.route('/simulate-impact', methods=['POST'])
def simulate_impact():
    """Core simulation endpoint. Calculates effects, adjusting for impact angle."""
    data = request.get_json()
    print("Received from frontend:", data)  # Debug: Show payload in terminal

    # --- Input Processing ---
    diameter = data.get('diameter')
    velocity = data.get('velocity')
    density = data.get('density', TARGET_DENSITY)
    angle = data.get('angle', 90)  # 90 degrees is a direct hit
    location = data.get('location')

    # Validation
    if not (diameter and velocity and isinstance(diameter, (int, float)) and isinstance(velocity, (int, float))):
        return jsonify({"error": "Valid 'diameter' and 'velocity' values are required (in MKS units)."}), 400

    # --- Run Calculations ---
    mass = estimate_mass(diameter, density)
    # Effective velocity is the component perpendicular to the surface: v_eff = v * sin(angle)
    velocity_effective = velocity * math.sin(math.radians(angle))
    energy = calculate_kinetic_energy(mass, velocity_effective)
    crater = estimate_crater_diameter(energy)
    seismic_mag = estimate_seismic_magnitude(energy)
    tsunami_risk = is_ocean_impact(location)
    energy_mt = energy / MEGATON_JOULES

    # --- Output Result ---
    result = {
        "input_params": {
            "diameter_m": diameter,
            "velocity_m_s": velocity,
            "density_kg_m3": density,
            "angle_deg": angle,
            "location": location
        },
        "calculated_mass_kg": mass,
        "kinetic_energy": {
            "joules": energy,
            "megatons_tnt": energy_mt,
            "effective_velocity_m_s": velocity_effective
        },
        "impact_effects": {
            "crater_diameter_m_approx": round(crater, 2),
            "seismic_magnitude": seismic_mag,
            "tsunami_risk": tsunami_risk,
            "note": "Crater size and seismic magnitude are approximations based on simplified physics models."
        }
    }
    return jsonify(result)

# --- 4. Application Execution ---

if __name__ == '__main__':
    # Run the Flask development server
    app.run(debug=True)