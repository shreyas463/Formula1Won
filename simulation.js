let pyodide = null;
let simulation = null;
let isRunning = false;
let selectedConfig = null;
let isPyodideLoaded = false;

// Initialize Pyodide
async function initPyodide() {
    try {
        updateStatus("Loading Pyodide environment...", "info");
        console.log("Loading Pyodide...");
        pyodide = await loadPyodide();
        console.log("Loading packages...");
        updateStatus("Loading required packages...", "info");
        await pyodide.loadPackage(['numpy']);
        console.log("Pyodide loaded successfully");
        isPyodideLoaded = true;
        updateStatus("Ready! Please select a configuration.", "success");
    } catch (error) {
        console.error("Error initializing Pyodide:", error);
        updateStatus("Failed to load Pyodide: " + error.message, "error");
    }
}

// Initialize the UI
function initUI() {
    const configCards = document.querySelectorAll('.config-card');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    configCards.forEach(card => {
        card.addEventListener('click', () => {
            if (!isPyodideLoaded) {
                updateStatus("Still loading Pyodide. Please wait...", "error");
                return;
            }
            
            configCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedConfig = card.dataset.config;
            startBtn.disabled = false;
            updateStatus(`Configuration ${selectedConfig} selected. Click Start to begin simulation.`, "info");
        });
    });

    startBtn.addEventListener('click', startSimulation);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetSimulation);
}

// Start the simulation
async function startSimulation() {
    if (!selectedConfig) {
        updateStatus("Please select a configuration first", "error");
        return;
    }

    updateStatus(`Starting simulation with configuration ${selectedConfig}...`, "info");
    const configFile = `dynamic_config${selectedConfig}.txt`;
    
    try {
        // Create a simple demo environment since we can't load the Python files
        createDemoEnvironment(selectedConfig);
        
        isRunning = true;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('reset-btn').disabled = false;

        // Start the simulation loop
        simulationLoop();
    } catch (error) {
        console.error('Error starting simulation:', error);
        updateStatus('Error starting simulation: ' + error.message, 'error');
    }
}

// Create a demo environment for web display
function createDemoEnvironment(configNum) {
    // Create a simple environment based on the configuration number
    const configs = {
        1: {
            gridSize: [30, 30],
            agentPos: [3, 0],
            goalPos: [2, 26],
            otherCars: [
                { pos: [2, 5], color: 'red' },
                { pos: [3, 10], color: 'blue' },
                { pos: [1, 15], color: 'green' },
                { pos: [2, 20], color: 'black' }
            ]
        },
        2: {
            gridSize: [30, 30],
            agentPos: [1, 0],
            goalPos: [3, 26],
            otherCars: [
                { pos: [1, 8], color: 'red' },
                { pos: [2, 12], color: 'blue' },
                { pos: [3, 18], color: 'green' },
                { pos: [2, 22], color: 'black' }
            ]
        },
        3: {
            gridSize: [30, 30],
            agentPos: [2, 0],
            goalPos: [1, 26],
            otherCars: [
                { pos: [1, 6], color: 'red' },
                { pos: [3, 14], color: 'blue' },
                { pos: [2, 19], color: 'green' },
                { pos: [1, 23], color: 'black' }
            ]
        },
        4: {
            gridSize: [30, 30],
            agentPos: [3, 0],
            goalPos: [3, 26],
            otherCars: [
                { pos: [2, 7], color: 'red' },
                { pos: [1, 13], color: 'blue' },
                { pos: [3, 17], color: 'green' },
                { pos: [2, 24], color: 'black' }
            ]
        },
        5: {
            gridSize: [30, 30],
            agentPos: [1, 0],
            goalPos: [2, 26],
            otherCars: [
                { pos: [1, 4], color: 'red' },
                { pos: [2, 9], color: 'blue' },
                { pos: [3, 16], color: 'green' },
                { pos: [1, 21], color: 'black' },
                { pos: [2, 25], color: 'red' }
            ]
        }
    };

    simulation = {
        config: configs[configNum],
        step: 0,
        maxSteps: 30,
        done: false,
        success: false,
        agentPath: [],
        currentState: {
            agent_pos: configs[configNum].agentPos,
            other_cars: configs[configNum].otherCars.map(car => [car.pos, car.color]),
            done: false,
            success: false
        }
    };

    // Add initial position to path
    simulation.agentPath.push([...simulation.config.agentPos]);
}

// Simulation loop
function simulationLoop() {
    if (!isRunning) return;

    try {
        if (simulation.step < simulation.maxSteps && !simulation.done) {
            // Update simulation state
            updateSimulationState();
            
            // Update visualization
            updateVisualization(simulation.currentState);
            
            // Check if simulation is complete
            if (simulation.currentState.done) {
                isRunning = false;
                updateStatus(
                    simulation.currentState.success ? 
                    'Simulation completed successfully!' : 
                    'Simulation aborted', 
                    simulation.currentState.success ? 'success' : 'error'
                );
                return;
            }
            
            simulation.step++;
            
            // Continue the loop
            setTimeout(simulationLoop, 500);
        } else {
            // End simulation if max steps reached
            simulation.currentState.done = true;
            simulation.currentState.success = 
                arraysEqual(simulation.currentState.agent_pos, simulation.config.goalPos);
            
            isRunning = false;
            updateStatus(
                simulation.currentState.success ? 
                'Simulation completed successfully!' : 
                'Maximum steps reached', 
                simulation.currentState.success ? 'success' : 'error'
            );
        }
    } catch (error) {
        console.error('Error in simulation loop:', error);
        updateStatus('Error during simulation: ' + error.message, 'error');
        isRunning = false;
    }
}

// Update simulation state
function updateSimulationState() {
    // Move agent toward goal
    const agent = simulation.currentState.agent_pos;
    const goal = simulation.config.goalPos;
    
    // Simple path finding - move toward goal
    let newPos = [...agent];
    
    // Decide whether to move horizontally or vertically
    if (Math.abs(agent[0] - goal[0]) > Math.abs(agent[1] - goal[1])) {
        // Move horizontally
        newPos[0] += agent[0] < goal[0] ? 1 : -1;
    } else {
        // Move vertically
        newPos[1] += agent[1] < goal[1] ? 1 : -1;
    }
    
    // Check for collisions with other cars
    const collision = simulation.currentState.other_cars.some(car => 
        arraysEqual(car[0], newPos)
    );
    
    if (collision) {
        // Try to avoid by moving in a different direction
        newPos = [...agent];
        if (Math.abs(agent[0] - goal[0]) <= Math.abs(agent[1] - goal[1])) {
            // Try horizontal instead
            newPos[0] += agent[0] < goal[0] ? 1 : -1;
        } else {
            // Try vertical instead
            newPos[1] += agent[1] < goal[1] ? 1 : -1;
        }
        
        // Check again for collision
        const stillCollision = simulation.currentState.other_cars.some(car => 
            arraysEqual(car[0], newPos)
        );
        
        if (stillCollision) {
            // Stay in place if still collision
            newPos = [...agent];
        }
    }
    
    // Update agent position
    simulation.currentState.agent_pos = newPos;
    simulation.agentPath.push([...newPos]);
    
    // Move other cars
    simulation.currentState.other_cars.forEach(car => {
        // Random movement for other cars
        const direction = Math.floor(Math.random() * 4);
        const pos = car[0];
        
        switch(direction) {
            case 0: // up
                if (pos[1] > 0) pos[1]--;
                break;
            case 1: // right
                if (pos[0] < simulation.config.gridSize[0] - 1) pos[0]++;
                break;
            case 2: // down
                if (pos[1] < simulation.config.gridSize[1] - 1) pos[1]++;
                break;
            case 3: // left
                if (pos[0] > 0) pos[0]--;
                break;
        }
    });
    
    // Check if goal reached
    if (arraysEqual(simulation.currentState.agent_pos, simulation.config.goalPos)) {
        simulation.currentState.done = true;
        simulation.currentState.success = true;
        simulation.done = true;
        simulation.success = true;
    }
}

// Helper function to compare arrays
function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

// Update the visualization
function updateVisualization(state) {
    const canvas = document.getElementById('simulation-canvas');
    const ctx = canvas.getContext('2d');
    const blockSize = 20;
    
    // Calculate grid dimensions
    const gridWidth = simulation.config.gridSize[0];
    const gridHeight = simulation.config.gridSize[1];
    
    // Resize canvas if needed
    canvas.width = gridWidth * blockSize;
    canvas.height = gridHeight * blockSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i <= gridWidth; i++) {
        ctx.beginPath();
        ctx.moveTo(i * blockSize, 0);
        ctx.lineTo(i * blockSize, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= gridHeight; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * blockSize);
        ctx.lineTo(canvas.width, i * blockSize);
        ctx.stroke();
    }
    
    // Draw goal
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(
        simulation.config.goalPos[0] * blockSize, 
        simulation.config.goalPos[1] * blockSize, 
        blockSize - 2, 
        blockSize - 2
    );
    
    // Draw agent path
    if (simulation.agentPath.length > 1) {
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
            simulation.agentPath[0][0] * blockSize + blockSize/2,
            simulation.agentPath[0][1] * blockSize + blockSize/2
        );
        
        for (let i = 1; i < simulation.agentPath.length; i++) {
            ctx.lineTo(
                simulation.agentPath[i][0] * blockSize + blockSize/2,
                simulation.agentPath[i][1] * blockSize + blockSize/2
            );
        }
        ctx.stroke();
    }

    // Draw other cars
    state.other_cars.forEach(([pos, color]) => {
        ctx.fillStyle = color;
        ctx.fillRect(pos[0] * blockSize, pos[1] * blockSize, blockSize - 2, blockSize - 2);
    });

    // Draw primary agent
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillRect(state.agent_pos[0] * blockSize, state.agent_pos[1] * blockSize, blockSize - 2, blockSize - 2);
    ctx.strokeRect(state.agent_pos[0] * blockSize, state.agent_pos[1] * blockSize, blockSize - 2, blockSize - 2);
}

// Toggle pause
function togglePause() {
    isRunning = !isRunning;
    document.getElementById('pause-btn').textContent = isRunning ? 'Pause' : 'Resume';
    
    if (isRunning) {
        simulationLoop();
    }
}

// Reset simulation
function resetSimulation() {
    isRunning = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('reset-btn').disabled = true;
    document.getElementById('pause-btn').textContent = 'Pause';
    
    // Clear the canvas
    const canvas = document.getElementById('simulation-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    simulation = null;
    updateStatus("Simulation reset. Select a configuration to start again.", "info");
}

// Update status message
function updateStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}

// Initialize everything when the page loads
window.addEventListener('load', async () => {
    updateStatus("Initializing simulation...", "info");
    initUI();
    await initPyodide();
}); 