# Formula1Won: Self-Driving Car Simulation

<p align="center">
  <img src="images/logo.png" alt="Formula1Won Logo" width="200">
</p>

A beautiful, interactive simulation of a self-driving car navigating through traffic.

![Formula1Won Simulation](https://i.imgur.com/placeholder.png)

## 🚀 Live Demo

Check out the live simulation: [Formula1Won Demo](https://formula1won.netlify.app/)

## 🎮 How to Use

1. **Select a Configuration**: Choose from 5 different traffic scenarios
2. **Start the Simulation**: Watch the self-driving car (white) navigate to its goal
3. **Controls**:
   - Start: Begin the simulation
   - Pause/Resume: Pause or continue the simulation
   - Reset: Start over with a new configuration

## 🔍 Features

- Beautiful blue gradient background with visual effects
- Realistic car movement with collision avoidance
- Multiple traffic scenarios to test different conditions
- Real-time path visualization
- Step counter and position tracking

## 🧠 How It Works

The simulation uses a simple but effective pathfinding algorithm to navigate the self-driving car (agent) through traffic:

1. **Environment**: The simulation creates a 30×30 grid world with roads, intersections, and other vehicles.

2. **Pathfinding Algorithm**:
   - The agent uses a greedy approach to move toward the goal
   - At each step, it calculates the Manhattan distance (horizontal + vertical) to the goal
   - It prioritizes movement along the axis with the greater distance to cover
   - This creates an efficient path that minimizes the number of steps needed to reach the goal
   - The path is dynamically recalculated at each step to respond to changing traffic conditions

3. **Collision Avoidance System**:
   - Before each move, the agent checks if the intended position is occupied by another vehicle
   - If a potential collision is detected, the agent implements a two-step avoidance strategy:
     1. First, it attempts to change direction (switching from horizontal to vertical movement or vice versa)
     2. If the alternative direction also leads to a collision, the agent stays in place for one step
   - This creates realistic "waiting" behavior when the path is temporarily blocked
   - The system continuously reassesses the environment, allowing the agent to resume movement when safe
   - Each other vehicle moves randomly, creating dynamic and unpredictable traffic patterns

4. **Visualization**: The simulation renders the environment using HTML5 Canvas, with smooth animations and visual effects to enhance the user experience.

## 🏗️ How It's Built

The project is built using vanilla web technologies without any frameworks:

1. **HTML5 Canvas**: Used for rendering the entire simulation, including the grid, cars, and visual effects.

2. **JavaScript**: Powers the simulation logic, including:
   - Agent movement and decision-making
   - Other vehicles' random movement
   - Collision detection
   - Path tracking and visualization

3. **CSS**: Creates a responsive and visually appealing UI with:
   - Gradient backgrounds
   - Card-based layout for configuration selection
   - Responsive design for different screen sizes
   - Visual effects like shadows and transitions

The simulation runs entirely in the browser with no backend dependencies, making it fast and easy to deploy.

## 💻 Running Locally

1. Clone the repository:
   ```
   git clone https://github.com/shreyas463/Formula1Won.git
   ```

2. Open the project folder:
   ```
   cd Formula1Won
   ```

3. Open `index.html` in your browser:
   ```
   open index.html
   ```

## 🛠️ Technologies Used

- HTML5 Canvas for rendering
- JavaScript for simulation logic
- CSS for styling

## 👨‍💻 Created By

Shreyas - [GitHub Profile](https://github.com/shreyas463) 