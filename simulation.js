let pyodide = null;
let simulation = null;
let isRunning = false;
let selectedConfig = null;

// Initialize Pyodide
async function initPyodide() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(['numpy', 'pygame']);
    console.log('Pyodide loaded successfully');
}

// Initialize the UI
function initUI() {
    const configCards = document.querySelectorAll('.config-card');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    configCards.forEach(card => {
        card.addEventListener('click', () => {
            configCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedConfig = card.dataset.config;
            startBtn.disabled = false;
        });
    });

    startBtn.addEventListener('click', startSimulation);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetSimulation);
}

// Start the simulation
async function startSimulation() {
    if (!selectedConfig) return;

    const configFile = `dynamic_config${selectedConfig}.txt`;
    const canvas = document.getElementById('simulation-canvas');
    const ctx = canvas.getContext('2d');

    try {
        // Load the Python files
        await pyodide.runPythonAsync(`
            import sys
            sys.path.append('.')
            from SearchAgent import SearchAgent
            from environment import Environment
            from simulator import Simulator
        `);

        // Initialize the environment and agent
        await pyodide.runPythonAsync(`
            env = Environment(config_file='${configFile}')
            agent = env.create_agent(SearchAgent)
            env.set_primary_agent(agent)
            sim = Simulator(env, display=False)
        `);

        isRunning = true;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('reset-btn').disabled = false;

        // Start the simulation loop
        simulationLoop();
    } catch (error) {
        console.error('Error starting simulation:', error);
        updateStatus('Error starting simulation', 'error');
    }
}

// Simulation loop
async function simulationLoop() {
    if (!isRunning) return;

    try {
        const result = await pyodide.runPythonAsync(`
            if not sim.env.done and sim.env.t < 100:
                sim.env.step()
                # Get the current state for visualization
                {
                    'agent_pos': sim.env.primary_agent.state['location'],
                    'other_cars': [(a.state['location'], a.color) for a in sim.env.agent_states.keys() if a != sim.env.primary_agent],
                    'done': sim.env.done,
                    'success': sim.env.success
                }
            else:
                None
        `);

        if (result) {
            // Update visualization
            updateVisualization(result);
            
            // Check if simulation is complete
            if (result.done) {
                isRunning = false;
                updateStatus(result.success ? 'Simulation completed successfully!' : 'Simulation aborted', 
                           result.success ? 'success' : 'error');
                return;
            }
        }

        // Continue the loop
        setTimeout(simulationLoop, 1000);
    } catch (error) {
        console.error('Error in simulation loop:', error);
        updateStatus('Error during simulation', 'error');
        isRunning = false;
    }
}

// Update the visualization
function updateVisualization(state) {
    const canvas = document.getElementById('simulation-canvas');
    const ctx = canvas.getContext('2d');
    const blockSize = 25;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i < canvas.width; i += blockSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += blockSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Draw other cars
    state.other_cars.forEach(([pos, color]) => {
        ctx.fillStyle = color;
        ctx.fillRect(pos[0] * blockSize, pos[1] * blockSize, blockSize - 2, blockSize - 2);
    });

    // Draw primary agent
    ctx.fillStyle = 'white';
    ctx.fillRect(state.agent_pos[0] * blockSize, state.agent_pos[1] * blockSize, blockSize - 2, blockSize - 2);
}

// Toggle pause
function togglePause() {
    isRunning = !isRunning;
    document.getElementById('pause-btn').textContent = isRunning ? 'Pause' : 'Resume';
}

// Reset simulation
function resetSimulation() {
    isRunning = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('reset-btn').disabled = true;
    document.getElementById('status').textContent = '';
    updateVisualization(null);
}

// Update status message
function updateStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}

// Initialize everything when the page loads
window.addEventListener('load', async () => {
    await initPyodide();
    initUI();
}); 