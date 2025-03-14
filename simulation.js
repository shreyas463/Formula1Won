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
let carImages = {};

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
    
    // Load car images
    loadCarImages();
    
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

// Load car images
function loadCarImages() {
    const colors = ['white', 'red', 'blue', 'green', 'black'];
    
    colors.forEach(color => {
        const img = new Image();
        img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="${color === 'white' ? '%23ffffff' : color === 'black' ? '%23000000' : color === 'red' ? '%23ef4444' : color === 'blue' ? '%232563eb' : '%2310b981'}" stroke="%23000000" stroke-width="0.5" d="M7,14v-1c0-0.55,0.45-1,1-1h8c0.55,0,1,0.45,1,1v1c0,0.55-0.45,1-1,1H8C7.45,15,7,14.55,7,14z M5,11l1.5-4.5C6.82,5.59,7.71,5,8.73,5h6.54c1.02,0,1.91,0.59,2.23,1.5L19,11H5z M19,13c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S19.55,13,19,13z M5,13c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S5.55,13,5,13z M8,18H5v-1c0-0.55,0.45-1,1-1h2V18z M19,18h-3v-2h2c0.55,0,1,0.45,1,1V18z"/></svg>`;
        carImages[color] = img;
    });
    
    // Add a flag image for the goal
    const flagImg = new Image();
    flagImg.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="%2310b981" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></svg>`;
    carImages['flag'] = flagImg;
}

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
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#dbeafe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
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
    
    // Draw road
    drawRoad(cellSize);
    
    // Draw path with glow effect
    if (path.length > 1) {
        // Draw glow
        ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        
        ctx.stroke();
        
        // Draw main path
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        
        ctx.stroke();
    }
    
    // Draw goal with glow effect
    ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
    ctx.shadowBlur = 10;
    ctx.drawImage(
        carImages['flag'],
        goal.x * cellSize,
        goal.y * cellSize,
        cellSize,
        cellSize
    );
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw other cars
    otherCars.forEach(car => {
        ctx.drawImage(
            carImages[car.color],
            car.x * cellSize,
            car.y * cellSize,
            cellSize,
            cellSize
        );
    });
    
    // Draw agent with glow effect
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 10;
    ctx.drawImage(
        carImages['white'],
        agent.x * cellSize,
        agent.y * cellSize,
        cellSize,
        cellSize
    );
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw step counter and info
    drawInfoPanel(cellSize);
}

// Draw road
function drawRoad(cellSize) {
    // Draw lanes with gradient
    const roadGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    roadGradient.addColorStop(0, '#f1f5f9');
    roadGradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = roadGradient;
    
    // Horizontal lanes
    for (let y = 0; y < 30; y += 3) {
        ctx.fillRect(0, y * cellSize, 30 * cellSize, cellSize * 2);
    }
    
    // Vertical lanes
    for (let x = 0; x < 30; x += 3) {
        ctx.fillRect(x * cellSize, 0, cellSize * 2, 30 * cellSize);
    }
    
    // Draw lane markers
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.setLineDash([cellSize / 4, cellSize / 4]);
    
    // Horizontal lane markers
    for (let y = 1; y < 30; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize + cellSize / 2);
        ctx.lineTo(30 * cellSize, y * cellSize + cellSize / 2);
        ctx.stroke();
    }
    
    // Vertical lane markers
    for (let x = 1; x < 30; x += 3) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize + cellSize / 2, 0);
        ctx.lineTo(x * cellSize + cellSize / 2, 30 * cellSize);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
    
    // Draw intersections
    for (let x = 0; x < 30; x += 3) {
        for (let y = 0; y < 30; y += 3) {
            if (x > 0 && y > 0) {
                ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
                ctx.fillRect(x * cellSize, y * cellSize, cellSize * 2, cellSize * 2);
            }
        }
    }
}

// Draw info panel
function drawInfoPanel(cellSize) {
    // Draw semi-transparent background with gradient
    const panelGradient = ctx.createLinearGradient(10, 10, 10, 70);
    panelGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    panelGradient.addColorStop(1, 'rgba(241, 245, 249, 0.9)');
    ctx.fillStyle = panelGradient;
    
    // Draw panel with rounded corners
    roundRect(ctx, 10, 10, 200, 60, 8, true, true);
    
    // Draw step counter
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px Montserrat';
    ctx.fillText(`Step: ${step}/${maxSteps}`, 20, 30);
    
    // Draw agent position
    ctx.font = '12px Montserrat';
    ctx.fillText(`Agent: (${agent.x}, ${agent.y})`, 20, 50);
    
    // Draw goal position
    ctx.fillText(`Goal: (${goal.x}, ${goal.y})`, 120, 50);
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
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