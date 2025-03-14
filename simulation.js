// Global variables
let selectedConfig = null;
let isRunning = false;
let isPaused = false;
let simulationInterval = null;
let canvas, ctx;
let agent = { x: 0, y: 0 };
let goal = { x: 0, y: 0 };
let otherCars = [];
let path = [];
let step = 0;
let maxSteps = 50;

// Configuration data
const configs = {
    1: {
        title: "Basic scenario with 17 cars",
        agentStart: { x: 3, y: 0 },
        goalPos: { x: 2, y: 26 },
        cars: [
            { x: 2, y: 5, color: 'red' },
            { x: 3, y: 10, color: 'blue' },
            { x: 1, y: 15, color: 'green' },
            { x: 2, y: 20, color: 'black' }
        ]
    },
    2: {
        title: "Different car arrangement",
        agentStart: { x: 1, y: 0 },
        goalPos: { x: 3, y: 26 },
        cars: [
            { x: 1, y: 8, color: 'red' },
            { x: 2, y: 12, color: 'blue' },
            { x: 3, y: 18, color: 'green' },
            { x: 2, y: 22, color: 'black' }
        ]
    },
    3: {
        title: "Alternative starting position",
        agentStart: { x: 2, y: 0 },
        goalPos: { x: 1, y: 26 },
        cars: [
            { x: 1, y: 6, color: 'red' },
            { x: 3, y: 14, color: 'blue' },
            { x: 2, y: 19, color: 'green' },
            { x: 1, y: 23, color: 'black' }
        ]
    },
    4: {
        title: "Another variation",
        agentStart: { x: 3, y: 0 },
        goalPos: { x: 3, y: 26 },
        cars: [
            { x: 2, y: 7, color: 'red' },
            { x: 1, y: 13, color: 'blue' },
            { x: 3, y: 17, color: 'green' },
            { x: 2, y: 24, color: 'black' }
        ]
    },
    5: {
        title: "Complex scenario",
        agentStart: { x: 1, y: 0 },
        goalPos: { x: 2, y: 26 },
        cars: [
            { x: 1, y: 4, color: 'red' },
            { x: 2, y: 9, color: 'blue' },
            { x: 3, y: 16, color: 'green' },
            { x: 1, y: 21, color: 'black' },
            { x: 2, y: 25, color: 'red' }
        ]
    }
};

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Get canvas and context
    canvas = document.getElementById('simulation-canvas');
    ctx = canvas.getContext('2d');
    
    // Set up event listeners for config cards
    const configCards = document.querySelectorAll('.config-card');
    configCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            configCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Store selected config
            selectedConfig = this.getAttribute('data-config');
            
            // Enable start button
            document.getElementById('start-btn').disabled = false;
            
            // Show status message
            updateStatus(`Configuration ${selectedConfig} selected. Click Start to begin simulation.`, 'info');
        });
    });
    
    // Set up event listeners for buttons
    document.getElementById('start-btn').addEventListener('click', startSimulation);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('reset-btn').addEventListener('click', resetSimulation);
    
    // Initial status message
    updateStatus('Please select a configuration to begin.', 'info');
});

// Start the simulation
function startSimulation() {
    if (!selectedConfig) {
        updateStatus('Please select a configuration first.', 'error');
        return;
    }
    
    // Reset any previous simulation
    resetSimulationState();
    
    // Load the selected configuration
    const config = configs[selectedConfig];
    
    // Set up initial state
    agent = { ...config.agentStart };
    goal = { ...config.goalPos };
    otherCars = [...config.cars];
    path = [{ ...agent }];
    
    // Update UI
    document.getElementById('start-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('reset-btn').disabled = false;
    
    // Start simulation loop
    isRunning = true;
    isPaused = false;
    step = 0;
    
    // Clear any existing interval
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    
    // Set up new interval
    simulationInterval = setInterval(simulationStep, 500);
    
    // Show status
    updateStatus(`Running simulation with configuration ${selectedConfig}...`, 'info');
    
    // Draw initial state
    drawSimulation();
}

// Simulation step
function simulationStep() {
    if (!isRunning || isPaused) return;
    
    // Increment step counter
    step++;
    
    // Move agent toward goal
    moveAgent();
    
    // Move other cars
    moveOtherCars();
    
    // Check for collisions
    if (checkCollisions()) {
        isRunning = false;
        updateStatus('Simulation aborted: Collision detected!', 'error');
        clearInterval(simulationInterval);
        return;
    }
    
    // Check if goal reached
    if (agent.x === goal.x && agent.y === goal.y) {
        isRunning = false;
        updateStatus('Simulation completed successfully!', 'success');
        clearInterval(simulationInterval);
        return;
    }
    
    // Check if max steps reached
    if (step >= maxSteps) {
        isRunning = false;
        updateStatus('Maximum steps reached without reaching goal.', 'error');
        clearInterval(simulationInterval);
        return;
    }
    
    // Draw updated state
    drawSimulation();
}

// Move agent toward goal
function moveAgent() {
    // Simple path finding - move toward goal
    let newX = agent.x;
    let newY = agent.y;
    
    // Decide whether to move horizontally or vertically
    if (Math.abs(agent.x - goal.x) > Math.abs(agent.y - goal.y)) {
        // Move horizontally
        newX += agent.x < goal.x ? 1 : -1;
    } else {
        // Move vertically
        newY += agent.y < goal.y ? 1 : -1;
    }
    
    // Check for collisions with other cars at new position
    const collision = otherCars.some(car => car.x === newX && car.y === newY);
    
    if (collision) {
        // Try to avoid by moving in a different direction
        newX = agent.x;
        newY = agent.y;
        
        if (Math.abs(agent.x - goal.x) <= Math.abs(agent.y - goal.y)) {
            // Try horizontal instead
            newX += agent.x < goal.x ? 1 : -1;
        } else {
            // Try vertical instead
            newY += agent.y < goal.y ? 1 : -1;
        }
        
        // Check again for collision
        const stillCollision = otherCars.some(car => car.x === newX && car.y === newY);
        
        if (stillCollision) {
            // Stay in place if still collision
            newX = agent.x;
            newY = agent.y;
        }
    }
    
    // Update agent position
    agent.x = newX;
    agent.y = newY;
    
    // Add to path
    path.push({ x: agent.x, y: agent.y });
}

// Move other cars randomly
function moveOtherCars() {
    otherCars.forEach(car => {
        // Random movement for other cars
        const direction = Math.floor(Math.random() * 4);
        
        switch(direction) {
            case 0: // up
                if (car.y > 0) car.y--;
                break;
            case 1: // right
                if (car.x < 29) car.x++;
                break;
            case 2: // down
                if (car.y < 29) car.y++;
                break;
            case 3: // left
                if (car.x > 0) car.x--;
                break;
        }
    });
}

// Check for collisions
function checkCollisions() {
    return otherCars.some(car => car.x === agent.x && car.y === agent.y);
}

// Draw the simulation
function drawSimulation() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    const gridSize = 30;
    const cellSize = 20;
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    
    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= gridSize; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
    
    // Draw goal
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize - 2, cellSize - 2);
    
    // Draw path
    if (path.length > 1) {
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        
        ctx.stroke();
    }
    
    // Draw other cars
    otherCars.forEach(car => {
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x * cellSize, car.y * cellSize, cellSize - 2, cellSize - 2);
    });
    
    // Draw agent
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillRect(agent.x * cellSize, agent.y * cellSize, cellSize - 2, cellSize - 2);
    ctx.strokeRect(agent.x * cellSize, agent.y * cellSize, cellSize - 2, cellSize - 2);
    
    // Draw step counter
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.fillText(`Step: ${step}/${maxSteps}`, 10, 20);
}

// Toggle pause/resume
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
    
    if (isPaused) {
        updateStatus('Simulation paused. Click Resume to continue.', 'info');
    } else {
        updateStatus('Simulation resumed.', 'info');
    }
}

// Reset simulation
function resetSimulation() {
    resetSimulationState();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset UI
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('reset-btn').disabled = true;
    document.getElementById('pause-btn').textContent = 'Pause';
    
    // Show status
    updateStatus('Simulation reset. Select a configuration to begin.', 'info');
}

// Reset simulation state
function resetSimulationState() {
    isRunning = false;
    isPaused = false;
    step = 0;
    path = [];
    
    // Clear interval
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
}

// Update status message
function updateStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
} 