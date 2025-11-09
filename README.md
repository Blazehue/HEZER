(More to come(still in development for more features))-v2 Coming soon!

# 🚀 Space Shooter - Endless Flying Shooter Game

[![LittleJS](https://img.shields.io/badge/LittleJS-Engine-blue?style=for-the-badge)](https://github.com/KilledByAPixel/LittleJS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

An immersive browser-based endless flying shooter built with LittleJS, featuring third-person 2.5D perspective, pseudo-3D projection, and intense space combat action!

> 🎮 **Born from experimentation!** This game was created while exploring the LittleJS engine for the first time — a journey from curiosity to a fully-playable space shooter with nitro boosts, pseudo-3D combat, and retro-futuristic vibes!

## 📋 Table of Contents

- [Game Features](#-game-features)
- [Controls](#-controls)
- [Scoring System](#-scoring-system)
- [Health System](#-health-system)
- [Visual Style](#-visual-style)
- [Installation & Running](#-installation--running)
- [Project Structure](#-project-structure)
- [Technical Details](#-technical-details)
- [Gameplay Tips](#-gameplay-tips)
- [Advanced Features](#-advanced-features)
- [Troubleshooting](#-troubleshooting)
- [Credits](#-credits)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

## 🎮 Game Features

### ✨ Core Gameplay
- **Third-Person Perspective**: Pilot a futuristic spaceship from behind, just like Star Fox or After Burner
- **Endless Scrolling**: Continuously fly through space with increasing difficulty
- **Pseudo-3D Projection**: Full depth simulation with objects scaling based on distance
- **Real-Time 3D Collision Detection**: Distance-based collision system using x, y, z coordinates

### 🛰️ Spaceship Features
- **Sleek Design**: Metallic blue triangular hull with glowing cyan wing tips
- **Triple Engine Exhausts**: Bright blue thrusters with dynamic particle trails
- **Smooth Banking**: Ship tilts naturally when moving left and right
- **Cockpit Highlight**: Glowing center cockpit for futuristic feel

### 🎯 Weapon System
- **Dual Missile Launchers**: Fire two missiles simultaneously from both wings
- **Detailed Missiles**: Red warhead, metallic body, fins, and glowing blue exhaust
- **Smoke Trails**: Dynamic smoke effects behind each missile
- **Rapid Fire**: Hold spacebar for continuous missile barrage
- **Homing Missiles**: Missiles travel straight with smooth acceleration

### 🌌 Visual Effects
- **150+ Star Field**: Hyperspace tunnel effect with stars rushing toward camera
- **Ground Grid**: Cyan grid lines scrolling beneath for depth perception
- **Dynamic Camera**: Smooth camera following ship movement
- **Explosion Particles**: 3D particle debris with yellow-orange bursts
- **Depth-Based Scaling**: All objects scale realistically with distance

### ⚔️ Enemies & Obstacles
- **Enemy Ships**: Red menacing spacecraft that attack from a distance
- **Asteroids**: Irregular rocky obstacles with rotation
- **3D Spawning**: Enemies approach from maximum depth
- **Smart Collision**: Distance-based 3D collision detection

### 💻 Technical Implementation
- **Pseudo-3D Projection System**: 
  ```javascript
  function project3D(x, y, z) {
      const scale = CAMERA_FOV / (CAMERA_FOV + z);
      return { x: x * scale, y: y * scale, scale };
  }
  ```
- **Depth Sorting**: Objects rendered in correct depth order
- **Particle Systems**: Engine trails, smoke, and explosions
- **Camera FOV**: 500 units for realistic perspective

## 🕹️ Controls

| Control | Action |
|---------|--------|
| **Arrow Keys** or **A/D** | Move left and right |
| **W/S** | Move up and down slightly |
| **Spacebar** | Fire dual missiles |
| **Hold Spacebar** | Rapid-fire mode |
| **R** (when game over) | Restart game |

## 🎯 Scoring System

- **Destroy Enemy Ship**: +100 points
- **Destroy Asteroid**: +50 points
- **Distance Traveled**: Tracked in meters
- **Difficulty**: Increases every 500 meters

## 🏥 Health System

- **Starting Health**: 100 HP
- **Enemy Collision**: -20 HP
- **Asteroid Collision**: -15 HP
- **Visual Health Bar**: Color-coded (green → yellow → red)
- **Game Over**: Health reaches 0

## 🎨 Visual Style

- **Color Scheme**:
  - Player Ship: Metallic blue (#4488ff) with cyan highlights (#00ffff)
  - Missiles: Red warhead (#ff3333) with blue exhaust (#00bbff)
  - Enemies: Menacing red (#ff4444)
  - Asteroids: Gray-purple (#8888aa)
  - Space: Deep black-blue (#000011)
  - Grid Lines: Cyan with transparency (#00ffff)

- **Effects**:
  - Glow effects on engines and weapons
  - Particle trails with fade-out
  - Smooth easing animations
  - Shadow and blur for depth

## 📦 Installation & Running

### Option 1: Local Server (Recommended)

1. **Open folder in VS Code**
2. **Install Live Server extension** (if not already installed)
3. **Right-click `index.html`** and select "Open with Live Server"
4. **Game opens in browser** automatically

### Option 2: Python HTTP Server

```bash
# Navigate to game folder
cd "c:\Users\pandr\OneDrive\Desktop\BrowerBasedGamesLITTLEJAM"

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

### Option 3: Direct File Opening

Simply double-click `index.html` to open in your default browser.

## 📁 Project Structure

```
BrowerBasedGamesLITTLEJAM/
├── index.html          # Main HTML file with UI and canvas
├── game.js            # Complete game logic and rendering
└── README.md          # This file
```

## 🔧 Technical Details

### Dependencies
- **LittleJS Engine**: v1.10.5 (loaded from CDN)
- **No additional dependencies required**

### Game Architecture

1. **Pseudo-3D System**
   - Camera FOV: 500 units
   - Depth range: -100 to 2000 units
   - Ship position: z = -200 (fixed)
   - Objects scale based on distance from camera

2. **Object Classes**
   - `Spaceship`: Player-controlled ship with health and movement
   - `Missile`: Dual-fire projectiles with smoke trails
   - `Enemy`: AI-controlled hostile ships
   - `Asteroid`: Rotating obstacles
   - `Star`: Background starfield particles
   - `GroundLine`: Grid system for depth perception

3. **Game Loop**
   - Update: 60 FPS game logic
   - Render: Depth-sorted drawing
   - Input: Real-time keyboard handling

4. **Collision Detection**
   - 3D distance calculation: `√(dx² + dy² + dz²)`
   - Radius-based collision spheres
   - Separate checks for missiles, enemies, and player

5. **Particle Systems**
   - Engine trails: Blue glowing particles
   - Missile smoke: Gray fading particles
   - Explosions: Yellow-orange debris scatter

## 🎮 Gameplay Tips

1. **Stay Mobile**: Keep moving to avoid obstacles
2. **Aim Ahead**: Missiles need time to reach distant targets
3. **Prioritize Enemies**: They're worth more points and more dangerous
4. **Watch Your Health**: Collisions add up quickly
5. **Use Rapid Fire**: Hold spacebar for continuous attack
6. **Mind the Edges**: Don't fly off-screen
7. **Distance Matters**: Difficulty increases over time

## 🌟 Advanced Features

### Difficulty Scaling
- Speed increases every 500 meters
- More frequent spawns at higher levels
- Both enemies and obstacles become faster

### Visual Polish
- Smooth camera interpolation
- Ship banking animation
- Glowing effects on all energy elements
- Layered particle systems
- Depth fog effect

### Performance
- Efficient object pooling
- Culling of off-screen objects
- Optimized particle systems
- 60 FPS target on modern browsers

## 🐛 Troubleshooting

**Game doesn't load?**
- Check browser console for errors (F12)
- Ensure internet connection (LittleJS loads from CDN)
- Try a different browser (Chrome, Firefox, Edge recommended)

**Slow performance?**
- Close other browser tabs
- Update graphics drivers
- Try reducing browser zoom level

**Controls not working?**
- Click on the game canvas to focus
- Check if keys are working in other applications
- Try refreshing the page

## 📝 Credits

- **Engine**: LittleJS by Frank Force
- **Game Design & Code**: Custom implementation
- **Graphics**: Pure canvas rendering
- **Sound**: (Optional - can be added)

## 🚀 Future Enhancements

Potential additions:
- Power-up pickups (shields, rapid fire, speed boost)
- Background music and sound effects
- Multiple enemy types with different behaviors
- Boss battles at distance milestones
- Leaderboard system
- Weapon upgrades
- Parallax background layers
- More particle effects

## 📄 License

Free to use, modify, and distribute. Have fun! 🎮

---

<p align="center">
  Enjoy your flight through space, Commander! 🚀✨<br>
  Made with ❤️ by <a href="https://github.com/Blazehue">Blazehue</a>
</p>