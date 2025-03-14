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
    
    // Set canvas dimensions - increase cell size for larger simulation area
    const gridSize = 30;
    const cellSize = 30; // Increased from 25 to 30
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    
    // Draw background with more vibrant gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#dbeafe'); // Lighter blue
    gradient.addColorStop(0.3, '#93c5fd'); // Medium blue
    gradient.addColorStop(0.7, '#60a5fa'); // Deeper blue
    gradient.addColorStop(1, '#3b82f6'); // Rich blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle pattern to background
    drawBackgroundPattern(cellSize);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        
        ctx.stroke();
        
        // Draw main path
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        
        ctx.stroke();
    }
    
    // Draw goal with glow effect
    ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
    ctx.shadowBlur = 15;
    ctx.drawImage(
        carImages['flag'],
        goal.x * cellSize + cellSize/6,
        goal.y * cellSize + cellSize/6,
        cellSize*2/3,
        cellSize*2/3
    );
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw other cars
    otherCars.forEach(car => {
        // Add glow effect for other cars
        ctx.shadowColor = `rgba(${car.color === 'red' ? '239, 68, 68' : car.color === 'blue' ? '37, 99, 235' : car.color === 'green' ? '16, 185, 129' : '0, 0, 0'}, 0.6)`;
        ctx.shadowBlur = 10;
        
        ctx.drawImage(
            carImages[car.color],
            car.x * cellSize + cellSize/6,
            car.y * cellSize + cellSize/6,
            cellSize*2/3,
            cellSize*2/3
        );
    });
    
    // Draw agent with glow effect
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 15;
    ctx.drawImage(
        carImages['white'],
        agent.x * cellSize + cellSize/6,
        agent.y * cellSize + cellSize/6,
        cellSize*2/3,
        cellSize*2/3
    );
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw step counter and info
    drawInfoPanel(cellSize);
}

// Draw background pattern
function drawBackgroundPattern(cellSize) {
    // Draw subtle dots pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    
    for (let x = 0; x < canvas.width; x += cellSize) {
        for (let y = 0; y < canvas.height; y += cellSize) {
            if ((x + y) % (cellSize * 2) === 0) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Add some decorative elements
    // Draw compass rose in the corner
    drawCompassRose(canvas.width - 70, canvas.height - 70, 50);
}

// Draw compass rose
function drawCompassRose(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw cardinal directions
    const directions = [
        { letter: 'N', angle: -Math.PI/2 },
        { letter: 'E', angle: 0 },
        { letter: 'S', angle: Math.PI/2 },
        { letter: 'W', angle: Math.PI }
    ];
    
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.font = 'bold 12px Montserrat';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    directions.forEach(dir => {
        const x = Math.cos(dir.angle) * (size/2 - 10);
        const y = Math.sin(dir.angle) * (size/2 - 10);
        ctx.fillText(dir.letter, x, y);
    });
    
    // Draw compass needle
    ctx.beginPath();
    ctx.moveTo(0, -size/3);
    ctx.lineTo(size/10, 0);
    ctx.lineTo(0, size/3);
    ctx.lineTo(-size/10, 0);
    ctx.closePath();
    
    const needleGradient = ctx.createLinearGradient(0, -size/3, 0, size/3);
    needleGradient.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
    needleGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.5)');
    needleGradient.addColorStop(1, 'rgba(30, 41, 59, 0.7)');
    
    ctx.fillStyle = needleGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    
    ctx.restore();
}

// Draw road
function drawRoad(cellSize) {
    // Draw lanes with gradient
    const roadGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    roadGradient.addColorStop(0, 'rgba(241, 245, 249, 0.5)');
    roadGradient.addColorStop(1, 'rgba(226, 232, 240, 0.5)');
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
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
                ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
                ctx.fillRect(x * cellSize, y * cellSize, cellSize * 2, cellSize * 2);
                
                // Add intersection details
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(x * cellSize + cellSize, y * cellSize + cellSize, cellSize / 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
}

// Draw info panel
function drawInfoPanel(cellSize) {
    // Draw semi-transparent background with gradient
    const panelGradient = ctx.createLinearGradient(10, 10, 10, 80);
    panelGradient.addColorStop(0, 'rgba(30, 58, 138, 0.8)'); // Dark blue
    panelGradient.addColorStop(1, 'rgba(30, 64, 175, 0.8)'); // Slightly lighter blue
    ctx.fillStyle = panelGradient;
    
    // Draw panel with rounded corners
    roundRect(ctx, 10, 10, 220, 70, 10, true, true);
    
    // Add border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    roundRect(ctx, 10, 10, 220, 70, 10, false, true);
    
    // Draw step counter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Montserrat';
    ctx.fillText(`Step: ${step}/${maxSteps}`, 25, 35);
    
    // Draw agent position
    ctx.font = '14px Montserrat';
    ctx.fillText(`Agent: (${agent.x}, ${agent.y})`, 25, 60);
    
    // Draw goal position
    ctx.fillText(`Goal: (${goal.x}, ${goal.y})`, 130, 60);
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