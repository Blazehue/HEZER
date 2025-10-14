///////////////////////////////////////////////////////////////////////////////
// Space Shooter - LittleJS Endless Flying Shooter
// Third-person 2.5D perspective with pseudo-3D projection
///////////////////////////////////////////////////////////////////////////////

'use strict';

///////////////////////////////////////////////////////////////////////////////
// Game Constants
const CAMERA_FOV = 500;
const CAMERA_Z = 0;
const MAX_DEPTH = 2000;
const MIN_DEPTH = -100;
const SHIP_Z = -200;
const GRID_SIZE = 100;
const GRID_LINES = 50;
const STAR_COUNT = 150;

///////////////////////////////////////////////////////////////////////////////
// Game Variables
let player;
let score = 0;
let distance = 0;
let gameActive = true;
let gamePaused = false;
let missiles = [];
let enemies = [];
let asteroids = [];
let powerups = [];
let stars = [];
let gridOffset = 0;
let explosions = [];
let difficulty = 1;
let spawnTimer = 0;
let powerupTimer = 0;
let cameraShake = { x: 0, y: 0, intensity: 0 };
let canvasWidth = 1280;
let canvasHeight = 720;
let speedBoost = 0;
let speedLines = [];
// Nitro system
// Nitro system (reintroduced as controlled feature)
let nitroSystem = null;

// New gameplay systems
let comboCount = 0;
let comboTimer = 0;
let bestCombo = 0;
let totalKills = 0;
let currentLevel = 1;
let xp = 0;
let xpToNextLevel = 100;

// Mission system
let currentMission = {
    type: 'destroyAsteroids',
    target: 20,
    current: 0,
    completed: false,
    description: 'Destroy 20 asteroids'
};

let missionTypes = [
    { type: 'destroyAsteroids', description: 'Destroy {n} asteroids', min: 15, max: 30 },
    { type: 'destroyEnemies', description: 'Destroy {n} enemies', min: 10, max: 20 },
    { type: 'surviveDistance', description: 'Travel {n}m', min: 2000, max: 5000 },
    { type: 'reachCombo', description: 'Reach {n}x combo', min: 5, max: 15 }
];

///////////////////////////////////////////////////////////////////////////////
// 3D Projection Function
function project3D(x, y, z) {
    const scale = CAMERA_FOV / (CAMERA_FOV + z - SHIP_Z);
    // Scale based on canvas size
    const scaleFactor = Math.min(canvasWidth, canvasHeight) / 720;
    return {
        x: x * scale * scaleFactor,
        y: y * scale * scaleFactor,
        scale: scale * scaleFactor
    };
}

///////////////////////////////////////////////////////////////////////////////
// Nitro System
class NitroSystem {
    constructor(player, boostMultiplier = 1.8, boostDuration = 3.8) {
        this.player = player;
        this.boostMultiplier = boostMultiplier;
        this.boostDuration = boostDuration; // seconds
        this.energy = 0.0; // 0 to 1
        this.isActive = false;
        this.timer = 0;
        this.glowPulse = 0;
    }

    isReady() {
        return this.energy >= 1 && !this.isActive;
    }

    activate() {
        if (!this.isReady()) return;
        this.isActive = true;
        this.timer = this.boostDuration;
        this.energy = 0;
        // create burst of engine particles
        for (let i = 0; i < 20; i++) {
            engineParticlesAdd(this.player.x + (Math.random() - 0.5) * 20, this.player.y + (Math.random() - 0.5) * 8, this.player.z + 10, true);
        }
    // stronger camera shake on activation
    addCameraShake(12);
        // set speedBoost value used elsewhere temporarily (multiplier - 1)
        speedBoost = this.boostMultiplier - 1;
    }

    addCharge(amount) {
        this.energy = Math.max(0, Math.min(1, this.energy + amount));
    }

    update(dt) {
        // dt in seconds (approx)
        this.glowPulse += dt * 4;
        if (this.isActive) {
            this.timer -= dt;
            // keep a temporary speed multiplier via speedBoost variable
            speedBoost = this.boostMultiplier - 1;
            if (this.timer <= 0) {
                this.isActive = false;
                speedBoost = 0;
            } else {
                // emit continuous particles while active
                if (Math.random() > 0.4) engineParticlesAdd(this.player.x + (Math.random() - 0.5) * 30, this.player.y + (Math.random() - 0.5) * 10, this.player.z + 10, false);
                // stronger camera shake while active
                addCameraShake(2);
                // create speed lines effect occasionally
                if (Math.random() > 0.85) createSpeedLine();
            }
        }
    }

    drawHUD(context) {
        if (!context) return;
        const canvas = document.getElementById('gameCanvas');
        const w = canvas.width;
        const h = canvas.height;
        const barWidth = Math.min(300, w * 0.35);
        const barHeight = 18;
        const x = w / 2 - barWidth / 2;
        const y = h - 60;

        // Background
        context.save();
        context.globalAlpha = 0.9;
        context.fillStyle = 'rgba(0,0,0,0.5)';
        roundRect(context, x - 4, y - 4, barWidth + 8, barHeight + 8, 6, true, false);

        // Fill
        const pct = this.energy;
        context.fillStyle = this.isReady() ? '#00ccff' : '#0077aa';
        context.fillRect(x, y, Math.max(2, barWidth * pct), barHeight);

        // Glow when ready
        if (this.isReady()) {
            const glow = 0.5 + Math.sin(this.glowPulse) * 0.5;
            context.strokeStyle = `rgba(0,200,255,${0.9 * glow})`;
            context.lineWidth = 3;
            context.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        } else {
            context.strokeStyle = '#444444';
            context.lineWidth = 2;
            context.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        }

        // Percentage text
        context.fillStyle = '#ffffff';
        context.font = '14px sans-serif';
        context.textAlign = 'center';
        context.fillText(Math.round(pct * 100) + '%', x + barWidth / 2, y + barHeight - 4);

        context.restore();
    }
}

// Utility: rounded rect
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// small helper to spawn engine particles used by nitro
function engineParticlesAdd(x, y, z, burst = false) {
    // Reuse existing engine particle code structure on player
    // Create a simple particle object that the rendering code will read (push to global explosions array as small items)
    explosions.push({
        x, y, z,
        particles: Array.from({ length: burst ? 6 : 2 }, () => ({
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 4,
            dz: -6 - Math.random() * 6,
            life: 0.6 + Math.random() * 0.6,
            size: 4 + Math.random() * 6,
            color: '#44bbff',
            rotation: 0,
            rotationSpeed: 0
        }))
    });
}

///////////////////////////////////////////////////////////////////////////////
// Player Spaceship Class
class Spaceship {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = SHIP_Z;
        this.targetX = 0;
        this.targetY = 0;
        this.tilt = 0;
        this.health = 100;
        this.engineParticles = [];
        this.speedBoostActive = false;
        this.speedBoostTimer = 0;
    }

    update() {
        // Smoothly move towards target position
        this.x += (this.targetX - this.x) * 0.12;
        this.y += (this.targetY - this.y) * 0.12;
        this.tilt = (this.targetX - this.x) * 0.02;

        // Boost system removed: ensure flags/timers are reset
        this.speedBoostActive = false;
        this.speedBoostTimer = 0;

        // Occasionally emit engine particles
        if (Math.random() > 0.6) this.createEngineParticle();

        // Update engine particles
        const particleSpeed = 8;
        this.engineParticles = this.engineParticles.filter(p => {
            if (p.vx !== undefined) {
                p.x += p.vx;
                p.y += p.vy;
                p.z += particleSpeed * 0.5;
            } else {
                p.z += particleSpeed;
            }
            p.life -= 0.02;
            return p.life > 0 && p.z < 100;
        });
    }
    
    activateSpeedBoost(superBoost = false) {
        // Boost feature removed: no-op
        return;
    }

    createEngineParticle() {
        const exhaustOffsets = [
            { x: -60, y: 0 },  // Left wing end
            { x: 60, y: 0 }    // Right wing end
        ];

        const color = this.speedBoostActive ? 
            `rgba(255, 100, 255, ${0.9})` : // Purple/magenta when boosting
            `rgba(0, 200, 255, ${0.9})`; // Normal cyan

        exhaustOffsets.forEach(offset => {
            this.engineParticles.push({
                x: this.x + offset.x + (Math.random() - 0.5) * 8,
                y: this.y + offset.y + (Math.random() - 0.5) * 8,
                z: this.z + 20,
                life: 1,
                color: color
            });
        });
    }

    draw(context) {
        const proj = project3D(this.x, this.y, this.z);
        const size = 35 * proj.scale;

        context.save();
        context.translate(proj.x, proj.y);
        context.rotate(this.tilt);

        // LASER GLOW EFFECT - Draw behind spaceship when boosting
        if (this.speedBoostActive) {
            const laserIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7; // Pulsing effect
            // Make the boost beam visually smaller but punchy
            const beamLength = size * 4.0; // reduced from 8x
            const beamWidth = size * 0.8; // slightly slimmer
            // Main laser beam (red for normal, purple for super)
            const gradient = context.createLinearGradient(0, 0, 0, beamLength);
            gradient.addColorStop(0, `rgba(255, 0, 50, ${0.9 * laserIntensity})`);
            gradient.addColorStop(0.3, `rgba(255, 50, 100, ${0.6 * laserIntensity})`);
            gradient.addColorStop(0.6, `rgba(255, 100, 150, ${0.3 * laserIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 150, 200, 0)');
            
            context.fillStyle = gradient;
            context.fillRect(-beamWidth/2, size * 0.5, beamWidth, beamLength);
            
            // Outer glow layers
            context.shadowBlur = isSuper ? 40 : 50;
            context.shadowColor = isSuper ? '#9b30ff' : '#ff0033';
            context.fillStyle = isSuper ? `rgba(160,32,255,${0.45 * laserIntensity})` : `rgba(255, 0, 50, ${0.4 * laserIntensity})`;
            context.fillRect(-beamWidth*0.9, size * 0.5, beamWidth*1.8, beamLength*0.9);
            
            // Inner bright core
            context.shadowBlur = isSuper ? 28 : 30;
            context.shadowColor = isSuper ? '#b06bff' : '#ff3366';
            context.fillStyle = isSuper ? `rgba(200,120,255,${0.7 * laserIntensity})` : `rgba(255, 100, 150, ${0.6 * laserIntensity})`;
            context.fillRect(-beamWidth*0.5, size * 0.5, beamWidth, beamLength*0.75);
            
            // Very bright center streak
            context.shadowBlur = 20;
            context.shadowColor = '#ffffff';
            context.fillStyle = `rgba(255, 255, 255, ${0.8 * laserIntensity})`;
            context.fillRect(-beamWidth*0.15, size * 0.5, beamWidth*0.3, beamLength*0.6);
            
            context.shadowBlur = 0;
        }

        // Draw engine trails
        this.engineParticles.forEach(p => {
            const pProj = project3D(p.x, p.y, p.z);
            const pSize = 5 * pProj.scale * p.life;
            context.fillStyle = p.color;
            context.globalAlpha = p.life * 0.6;
            context.fillRect(pProj.x - proj.x - pSize/2, pProj.y - proj.y - pSize/2, pSize, pSize);
        });
        context.globalAlpha = 1;

        // Left wing arm
        context.fillStyle = '#ff6644';
        context.fillRect(-size * 1.8, -size * 0.15, size * 0.9, size * 0.3);
        
        // Left wing end cap (white)
        context.fillStyle = '#ffffff';
        context.fillRect(-size * 1.9, -size * 0.2, size * 0.15, size * 0.4);
        
        // Left wing inner (dark)
        context.fillStyle = '#555566';
        context.fillRect(-size * 0.9, -size * 0.1, size * 0.15, size * 0.2);

        // Right wing arm
        context.fillStyle = '#ff6644';
        context.fillRect(size * 0.9, -size * 0.15, size * 0.9, size * 0.3);
        
        // Right wing end cap (white)
        context.fillStyle = '#ffffff';
        context.fillRect(size * 1.75, -size * 0.2, size * 0.15, size * 0.4);
        
        // Right wing inner (dark)
        context.fillStyle = '#555566';
        context.fillRect(size * 0.75, -size * 0.1, size * 0.15, size * 0.2);

        // Central glowing core - outer glow
        context.shadowBlur = 30;
        context.shadowColor = '#00ffff';
        context.fillStyle = '#00ffff';
        context.fillRect(-size * 0.35, -size * 0.45, size * 0.7, size * 0.9);
        
        // Central glowing core - bright inner
        context.shadowBlur = 20;
        context.fillStyle = '#aaffff';
        context.fillRect(-size * 0.3, -size * 0.4, size * 0.6, size * 0.8);
        
        // Central glowing core - very bright center
        context.shadowBlur = 10;
        context.fillStyle = this.speedBoostActive ? '#ff66ff' : '#ffffff';
        context.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
        
        // Boost glow effect
        if (this.speedBoostActive) {
            context.shadowBlur = 40;
            context.shadowColor = '#ff00ff';
            context.fillStyle = 'rgba(255, 100, 255, 0.3)';
            context.fillRect(-size * 0.5, -size * 0.6, size, size * 1.2);
        }
        
        context.shadowBlur = 0;

        // Central divider line
        context.strokeStyle = '#888899';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(0, -size * 0.45);
        context.lineTo(0, size * 0.45);
        context.stroke();

        // Orange accent lines on wings
        context.strokeStyle = '#ff6644';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-size * 1.8, 0);
        context.lineTo(-size * 0.9, 0);
        context.stroke();
        
        context.beginPath();
        context.moveTo(size * 0.9, 0);
        context.lineTo(size * 1.8, 0);
        context.stroke();

        // Left wing detail panel
        context.fillStyle = '#333344';
        context.fillRect(-size * 1.6, -size * 0.08, size * 0.5, size * 0.16);
        
        // Right wing detail panel
        context.fillStyle = '#333344';
        context.fillRect(size * 1.1, -size * 0.08, size * 0.5, size * 0.16);

        // Small orange details on wing ends
        context.fillStyle = '#ff8844';
        context.fillRect(-size * 1.85, -size * 0.05, size * 0.05, size * 0.1);
        context.fillRect(size * 1.8, -size * 0.05, size * 0.05, size * 0.1);

        context.restore();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        updateHealthBar();
        
        // Camera shake on damage
        addCameraShake(10);
        
        // Reset combo on damage
        comboCount = 0;
        comboTimer = 0;
        updateComboDisplay();
        
        if (this.health <= 0) {
            this.explode();
            gameOver();
        }
    }

    explode() {
        createExplosion(this.x, this.y, this.z, 50, true);
        addCameraShake(15);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Missile Class
class Missile {
    constructor(x, y, z, offsetX) {
        this.x = x + offsetX;
        this.y = y;
        this.z = z;
        // Track previous position for continuous collision detection
        this.prevX = this.x;
        this.prevY = this.y;
        this.prevZ = this.z;
        this.speed = 25;
        this.alive = true;
        this.smokeParticles = [];
    }

    update() {
        const missileSpeed = this.speed + (speedBoost * 20);
        // store previous position before moving to allow segment collision checks
        this.prevX = this.x;
        this.prevY = this.y;
        this.prevZ = this.z;
        this.z += missileSpeed;

        // Create smoke trail
        if (Math.random() > 0.5) {
            this.smokeParticles.push({
                x: this.x + (Math.random() - 0.5) * 3,
                y: this.y + (Math.random() - 0.5) * 3,
                z: this.z - 10,
                life: 1,
                size: 3
            });
        }

        // Update smoke particles
        this.smokeParticles = this.smokeParticles.filter(p => {
            p.life -= 0.05;
            p.size += 0.2;
            return p.life > 0;
        });

        // Check if out of bounds
        if (this.z > MAX_DEPTH) {
            this.alive = false;
        }

        // Check collisions with enemies
        enemies.forEach(enemy => {
            if (enemy.alive && this.checkCollision(enemy)) {
                this.alive = false;
                enemy.explode();
                enemy.alive = false;
                
                // Combo system
                comboCount++;
                comboTimer = 180;
                if (comboCount > bestCombo) bestCombo = comboCount;
                updateComboDisplay();
                
                const comboBonus = comboCount > 1 ? comboCount * 20 : 0;
                score += 100 + comboBonus;
                totalKills++;
                updateScore();
                addXP(20 + comboBonus);
                // Grant small nitro charge on enemy kill
                if (nitroSystem) nitroSystem.addCharge(0.12);
                
                // Mission progress
                if (currentMission.type === 'destroyEnemies' && !currentMission.completed) {
                    currentMission.current++;
                    updateMissionCard();
                }
                if (currentMission.type === 'reachCombo' && comboCount >= currentMission.target && !currentMission.completed) {
                    currentMission.current = comboCount;
                    updateMissionCard();
                }
            }
        });

        // Check collisions with asteroids
        asteroids.forEach(asteroid => {
            if (asteroid.alive && this.checkCollision(asteroid)) {
                asteroid.takeHit(this); // Apply impact force
                // If applying the hit immediately pushes the asteroid into the player,
                // detect and apply damage right away so it doesn't "pass through".
                if (player && asteroid.checkCollision(player)) {
                    player.takeDamage(15);
                    // create a small explosion and mark asteroid dead
                    asteroid.explode();
                    asteroid.alive = false;
                    this.alive = false;
                } else {
                    // Normal behavior: destroy asteroid on missile hit
                    this.alive = false;
                    asteroid.explode();
                    asteroid.alive = false;
                }
                
                // Combo system
                comboCount++;
                comboTimer = 180; // 3 seconds
                if (comboCount > bestCombo) bestCombo = comboCount;
                updateComboDisplay();
                
                const comboBonus = comboCount > 1 ? comboCount * 10 : 0;
                score += 50 + comboBonus;
                totalKills++;
                updateScore();
                addXP(10 + comboBonus);
                // Grant small nitro charge on asteroid destroy
                if (nitroSystem) nitroSystem.addCharge(0.08);
                
                // Mission progress
                if (currentMission.type === 'destroyAsteroids' && !currentMission.completed) {
                    currentMission.current++;
                    updateMissionCard();
                }
                if (currentMission.type === 'reachCombo' && comboCount >= currentMission.target && !currentMission.completed) {
                    currentMission.current = comboCount;
                    updateMissionCard();
                }
            }
        });
    }

    checkCollision(target) {
        // Continuous collision detection: distance from target center to missile segment
        const x0 = this.prevX, y0 = this.prevY, z0 = this.prevZ;
        const x1 = this.x, y1 = this.y, z1 = this.z;
        const cx = target.x, cy = target.y, cz = target.z;

        const vx = x1 - x0, vy = y1 - y0, vz = z1 - z0;
        const wx = cx - x0, wy = cy - y0, wz = cz - z0;

        const vLen2 = vx*vx + vy*vy + vz*vz || 1;
        let t = (vx*wx + vy*wy + vz*wz) / vLen2;
        t = Math.max(0, Math.min(1, t));

        const closestX = x0 + vx * t;
        const closestY = y0 + vy * t;
        const closestZ = z0 + vz * t;

        const dx = closestX - cx;
        const dy = closestY - cy;
        const dz = closestZ - cz;
        const dist2 = dx*dx + dy*dy + dz*dz;

        // Collision radius: missiles are small, targets vary
        let radius = 30;
        if (target.size) radius = Math.max(20, (target.size + 10));
        if (target.size === undefined && target.size === null && target instanceof Enemy) radius = 30;

        return dist2 < radius * radius;
    }

    explode() {
        createExplosion(this.x, this.y, this.z, 30, true);
        addCameraShake(5);
    }

    draw(context) {
        const proj = project3D(this.x, this.y, this.z);
        const size = 8 * proj.scale;

        // Draw smoke trail
        this.smokeParticles.forEach(p => {
            const pProj = project3D(p.x, p.y, p.z);
            const pSize = p.size * pProj.scale;
            context.fillStyle = `rgba(150, 150, 150, ${p.life * 0.4})`;
            context.fillRect(pProj.x - pSize/2, pProj.y - pSize/2, pSize, pSize);
        });

        // Missile body
        context.fillStyle = '#ff3333';
        context.beginPath();
        context.arc(proj.x, proj.y, size * 0.6, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#888888';
        context.fillRect(proj.x - size * 0.3, proj.y - size, size * 0.6, size * 1.5);

        // Fins
        context.fillStyle = '#666666';
        context.beginPath();
        context.moveTo(proj.x, proj.y);
        context.lineTo(proj.x - size * 0.5, proj.y + size);
        context.lineTo(proj.x, proj.y + size * 0.5);
        context.closePath();
        context.fill();

        context.beginPath();
        context.moveTo(proj.x, proj.y);
        context.lineTo(proj.x + size * 0.5, proj.y + size);
        context.lineTo(proj.x, proj.y + size * 0.5);
        context.closePath();
        context.fill();

        // Exhaust glow
        context.fillStyle = '#00bbff';
        context.shadowBlur = 8;
        context.shadowColor = '#00bbff';
        context.beginPath();
        context.arc(proj.x, proj.y + size, size * 0.4, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Enemy Class
class Enemy {
    constructor() {
        this.x = (Math.random() - 0.5) * 600;
        this.y = (Math.random() - 0.5) * 400;
        this.z = MAX_DEPTH;
        this.speed = 8 + difficulty * 0.5;
        this.alive = true;
        this.rotation = 0;
        this.size = 25;
    }

    update() {
        const moveSpeed = this.speed + (speedBoost * 15);
        this.z -= moveSpeed;
        this.rotation += 0.05;

        // Check if passed player
        if (this.z < MIN_DEPTH) {
            this.alive = false;
            // Don't explode if just going off screen
        }

        // Check collision with player
        if (this.alive && this.checkCollision(player)) {
            player.takeDamage(20);
            this.explode();
            this.alive = false;
        }
    }

    checkCollision(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const dz = this.z - target.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < 40;
    }

    explode() {
        createExplosion(this.x, this.y, this.z, 35, true);
        addCameraShake(8);
    }

    draw(context) {
        const proj = project3D(this.x, this.y, this.z);
        const size = this.size * proj.scale;

        context.save();
        context.translate(proj.x, proj.y);
        context.rotate(this.rotation);

        // Enemy ship - purplish red
        context.fillStyle = '#dd6699';
        context.beginPath();
        context.moveTo(0, -size);
        context.lineTo(-size, size);
        context.lineTo(0, size * 0.5);
        context.lineTo(size, size);
        context.closePath();
        context.fill();

        context.strokeStyle = '#ff99cc';
        context.lineWidth = 2;
        context.stroke();

        // Enemy core
        context.fillStyle = '#ff4488';
        context.beginPath();
        context.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
}

// SpeedBoostPowerup removed (nitro pickups removed)

///////////////////////////////////////////////////////////////////////////////
// Speed Lines Effect
function createSpeedLine() {
    speedLines.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
        z: player.z - 50,
        life: 1,
        length: 50 + Math.random() * 100
    });
}

function updateSpeedLines() {
    speedLines = speedLines.filter(line => {
        line.z += 30;
        line.life -= 0.03;
        return line.life > 0 && line.z < 200;
    });
}

function drawSpeedLines(context) {
    speedLines.forEach(line => {
        const startProj = project3D(line.x, line.y, line.z);
        const endProj = project3D(line.x, line.y, line.z - line.length);
        
        context.strokeStyle = `rgba(255, 100, 255, ${line.life * 0.7})`;
        context.lineWidth = 2 * line.life;
        context.beginPath();
        context.moveTo(startProj.x, startProj.y);
        context.lineTo(endProj.x, endProj.y);
        context.stroke();
    });
}

///////////////////////////////////////////////////////////////////////////////
// Asteroid Class
class Asteroid {
    constructor() {
        this.x = (Math.random() - 0.5) * 600;
        this.y = (Math.random() - 0.5) * 400;
        this.z = MAX_DEPTH;
        this.speed = 6 + difficulty * 0.3;
        this.alive = true;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.size = 30 + Math.random() * 20;
        this.vertices = this.generateVertices();
        this.hitEffect = 0; // Impact effect
        this.hitVelocity = { x: 0, y: 0, z: 0 };
    }

    generateVertices() {
        const points = 8;
        const vertices = [];
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = 0.8 + Math.random() * 0.4;
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return vertices;
    }

    update() {
        // Apply hit velocity
        this.x += this.hitVelocity.x;
        this.y += this.hitVelocity.y;
        this.z += this.hitVelocity.z;
        
        // Decay hit velocity
        this.hitVelocity.x *= 0.9;
        this.hitVelocity.y *= 0.9;
        this.hitVelocity.z *= 0.9;
        
        // Normal movement (faster during speed boost)
        const moveSpeed = this.speed + (speedBoost * 15);
        this.z -= moveSpeed;
        this.rotation += this.rotationSpeed;
        
        // Decay hit effect
        if (this.hitEffect > 0) {
            this.hitEffect -= 0.05;
        }

        if (this.z < MIN_DEPTH) {
            this.alive = false;
            // Don't explode if just going off screen naturally
        }

        // Fallback: check missiles' segments against this asteroid to prevent tunneling
        for (let i = 0; i < missiles.length; i++) {
            const m = missiles[i];
            if (!m || !m.alive) continue;

            // Missile segment start/end
            const x0 = m.prevX, y0 = m.prevY, z0 = m.prevZ;
            const x1 = m.x,   y1 = m.y,   z1 = m.z;

            // Vector from segment start to end
            const vx = x1 - x0, vy = y1 - y0, vz = z1 - z0;
            const wx = this.x - x0, wy = this.y - y0, wz = this.z - z0;
            const vLen2 = vx*vx + vy*vy + vz*vz || 1;
            let t = (vx*wx + vy*wy + vz*wz) / vLen2;
            t = Math.max(0, Math.min(1, t));

            const closestX = x0 + vx * t;
            const closestY = y0 + vy * t;
            const closestZ = z0 + vz * t;

            const dx = closestX - this.x;
            const dy = closestY - this.y;
            const dz = closestZ - this.z;
            const dist2 = dx*dx + dy*dy + dz*dz;

            const radius = Math.max(20, this.size + 10);
            if (dist2 < radius * radius) {
                // Collision detected: explode asteroid and kill missile
                m.alive = false;
                this.explode();
                this.alive = false;
                // Update scoring/combos similarly to missile logic
                comboCount++;
                comboTimer = 180;
                if (comboCount > bestCombo) bestCombo = comboCount;
                updateComboDisplay();
                const comboBonus = comboCount > 1 ? comboCount * 10 : 0;
                score += 50 + comboBonus;
                totalKills++;
                updateScore();
                addXP(10 + comboBonus);
                if (nitroSystem) nitroSystem.addCharge(0.08);
                if (currentMission.type === 'destroyAsteroids' && !currentMission.completed) {
                    currentMission.current++;
                    updateMissionCard();
                }
                break; // asteroid destroyed, stop checking missiles
            }
        }

        // Check collision with player
        if (this.alive && this.checkCollision(player)) {
            player.takeDamage(15);
            this.explode();
            this.alive = false;
        }
    }

    takeHit(missile) {
        // Apply impact force
        const dx = this.x - missile.x;
        const dy = this.y - missile.y;
        const dz = this.z - missile.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        
        this.hitVelocity.x = (dx / dist) * 8;
        this.hitVelocity.y = (dy / dist) * 8;
        this.hitVelocity.z = (dz / dist) * 5;
        
        this.hitEffect = 1;
        this.rotationSpeed += (Math.random() - 0.5) * 0.3;
    }

    checkCollision(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const dz = this.z - target.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < this.size + 20;
    }

    explode() {
        createExplosion(this.x, this.y, this.z, 40, true);
        addCameraShake(6);
    }

    draw(context) {
        const proj = project3D(this.x, this.y, this.z);
        const size = this.size * proj.scale;

        context.save();
        context.translate(proj.x, proj.y);
        context.rotate(this.rotation);

        // Hit flash effect
        if (this.hitEffect > 0) {
            context.shadowBlur = 20 * this.hitEffect;
            context.shadowColor = '#ff8800';
        }

        context.fillStyle = this.hitEffect > 0 ? 
            `rgba(${150 + this.hitEffect * 105}, ${100 + this.hitEffect * 155}, 200, 1)` : 
            '#9988cc';
        context.strokeStyle = this.hitEffect > 0 ? '#ffaa00' : '#bbaadd';
        context.lineWidth = 2;
        
        context.beginPath();
        this.vertices.forEach((v, i) => {
            const x = v.x * size;
            const y = v.y * size;
            if (i === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        });
        context.closePath();
        context.fill();
        context.stroke();

        context.shadowBlur = 0;
        context.restore();
    }
}

///////////////////////////////////////////////////////////////////////////////
// Star Field
class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = (Math.random() - 0.5) * 1000;
        this.y = (Math.random() - 0.5) * 800;
        this.z = Math.random() * (MAX_DEPTH - MIN_DEPTH) + MIN_DEPTH;
        this.brightness = Math.random() * 0.5 + 0.5;
    }

    update() {
        const starSpeed = 20 + (speedBoost * 30);
        this.z -= starSpeed;
        
        if (this.z < MIN_DEPTH) {
            this.x = (Math.random() - 0.5) * 1000;
            this.y = (Math.random() - 0.5) * 800;
            this.z = MAX_DEPTH;
        }
    }

    draw(context) {
        const proj = project3D(this.x, this.y, this.z);
        const size = 2 * proj.scale * this.brightness;
        
        context.fillStyle = `rgba(200, 150, 255, ${this.brightness * 0.8})`;
        context.fillRect(proj.x - size/2, proj.y - size/2, size, size);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Infinite Perspective Grid
function drawInfiniteGrid(context, baseAlpha = 0.4) {
    const gridY = 300; // Position below the ship
    
    context.strokeStyle = `rgba(150, 100, 255, ${baseAlpha})`;
    context.lineWidth = 1;
    
    // Draw perspective grid lines
    for (let z = 0; z < 30; z++) {
        const depth = z * GRID_SIZE + (gridOffset % GRID_SIZE);
        
        if (depth > MAX_DEPTH) continue;
        
        // Horizontal lines
        const leftProj = project3D(-2000, gridY, depth);
        const rightProj = project3D(2000, gridY, depth);
        
        const alpha = (1 - (depth / MAX_DEPTH)) * baseAlpha;
        context.strokeStyle = `rgba(150, 100, 255, ${alpha})`;
        context.lineWidth = 1 + alpha;
        
        context.beginPath();
        context.moveTo(leftProj.x, leftProj.y);
        context.lineTo(rightProj.x, rightProj.y);
        context.stroke();
    }
    
    // Vertical lines
    for (let x = -10; x <= 10; x++) {
        const xPos = x * GRID_SIZE;
        
        const nearProj = project3D(xPos, gridY, 0);
        const farProj = project3D(xPos, gridY, MAX_DEPTH);
        
        context.strokeStyle = `rgba(150, 100, 255, ${baseAlpha * 0.8})`;
        context.lineWidth = 1;
        
        context.beginPath();
        context.moveTo(nearProj.x, nearProj.y);
        context.lineTo(farProj.x, farProj.y);
        context.stroke();
    }
}

function updateGrid() {
    const gridSpeed = 10 + (speedBoost * 20);
    gridOffset += gridSpeed;
}

///////////////////////////////////////////////////////////////////////////////
// Explosion Effect
function createExplosion(x, y, z, count, large = false) {
    const particleCount = large ? count * 1.5 : count;
    const speedMultiplier = large ? 1.5 : 1;
    
    explosions.push({
        x, y, z,
        particles: Array.from({ length: Math.floor(particleCount) }, () => ({
            dx: (Math.random() - 0.5) * 15 * speedMultiplier,
            dy: (Math.random() - 0.5) * 15 * speedMultiplier,
            dz: (Math.random() - 0.5) * 15 * speedMultiplier,
            life: 1,
            size: (5 + Math.random() * 8) * (large ? 1.5 : 1),
            color: Math.random() > 0.5 ? '#ff8800' : '#ffff00',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        }))
    });
}

///////////////////////////////////////////////////////////////////////////////
// Camera Shake
function addCameraShake(intensity) {
    cameraShake.intensity = Math.max(cameraShake.intensity, intensity);
}

function updateCameraShake() {
    if (cameraShake.intensity > 0) {
        cameraShake.x = (Math.random() - 0.5) * cameraShake.intensity;
        cameraShake.y = (Math.random() - 0.5) * cameraShake.intensity;
        cameraShake.intensity *= 0.9;
        
        if (cameraShake.intensity < 0.1) {
            cameraShake.intensity = 0;
            cameraShake.x = 0;
            cameraShake.y = 0;
        }
    }
}

function updateExplosions() {
    explosions = explosions.filter(exp => {
        exp.particles = exp.particles.filter(p => {
            p.dx *= 0.95;
            p.dy *= 0.95;
            p.dz *= 0.95;
            p.life -= 0.015;
            p.size *= 0.97;
            p.rotation += p.rotationSpeed;
            return p.life > 0;
        });
        return exp.particles.length > 0;
    });
}

function drawExplosions(context) {
    explosions.forEach(exp => {
        exp.particles.forEach(p => {
            const px = exp.x + p.dx * (1 - p.life) * 8;
            const py = exp.y + p.dy * (1 - p.life) * 8;
            const pz = exp.z + p.dz * (1 - p.life) * 8;
            
            const proj = project3D(px, py, pz);
            const size = p.size * proj.scale;
            
            context.save();
            context.translate(proj.x, proj.y);
            context.rotate(p.rotation);
            
            // Outer glow
            context.fillStyle = p.color;
            context.globalAlpha = p.life * 0.5;
            context.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
            
            // Inner bright
            context.fillStyle = '#ffffff';
            context.globalAlpha = p.life * 0.8;
            context.fillRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
            
            context.restore();
        });
    });
    context.globalAlpha = 1;
}

///////////////////////////////////////////////////////////////////////////////
// Input Handling
let keys = {};

document.addEventListener('keydown', (e) => {
    const keyName = (e.key || '').toLowerCase();
    keys[keyName] = true;
    // also set a friendly alias for space so holding is easy to check
    if (e.code === 'Space' || e.key === ' ') keys['space'] = true;

    if (e.key === ' ' && gameActive && !gamePaused) {
        e.preventDefault();
        fireMissiles();
    }
    
    if (e.key === 'Escape' && gameActive) {
        e.preventDefault();
        if (gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
    
    // Shift key handling: activate nitro if ready
    if ((e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') && nitroSystem) {
        nitroSystem.activate();
    }
    
    if (e.key.toLowerCase() === 'r' && !gameActive) {
        location.reload();
    }
});

document.addEventListener('keyup', (e) => {
    const keyName = (e.key || '').toLowerCase();
    keys[keyName] = false;
    if (e.code === 'Space' || e.key === ' ') keys['space'] = false;
});

function handleInput() {
    if (!gameActive) return;

    const moveSpeed = 8;

    // Horizontal movement
    if (keys['arrowleft'] || keys['a']) {
        player.targetX -= moveSpeed;
    }
    if (keys['arrowright'] || keys['d']) {
        player.targetX += moveSpeed;
    }

    // Vertical movement
    if (keys['arrowup'] || keys['w']) {
        player.targetY -= moveSpeed * 0.6;
    }
    if (keys['arrowdown'] || keys['s']) {
        player.targetY += moveSpeed * 0.6;
    }

    // Auto-fire while holding space (respecting fireRate inside fireMissiles)
    if (!gamePaused && (keys['space'] || keys[' '])) {
        fireMissiles();
    }
}

///////////////////////////////////////////////////////////////////////////////
// Fire Missiles
let lastFireTime = 0;
const fireRate = 150; // milliseconds

function fireMissiles() {
    const now = Date.now();
    if (now - lastFireTime < fireRate) return;
    
    lastFireTime = now;
    
    // Dual missiles from wings
    missiles.push(new Missile(player.x, player.y, player.z, -20));
    missiles.push(new Missile(player.x, player.y, player.z, 20));
}

///////////////////////////////////////////////////////////////////////////////
// Spawn Enemies and Obstacles
function spawnEnemies() {
    spawnTimer++;
    
    const spawnRate = Math.max(60 - difficulty * 2, 30);
    
    if (spawnTimer > spawnRate) {
        spawnTimer = 0;
        
        const rand = Math.random();
        if (rand < 0.6) {
            enemies.push(new Enemy());
        } else {
            asteroids.push(new Asteroid());
        }
    }
    
    // Spawn power-ups
    powerupTimer++;
    const powerupRate = 300; // Spawn every 5 seconds
    
    // Power-ups removed; we no longer spawn nitro pickups
    if (powerupTimer > powerupRate) {
        powerupTimer = 0;
        // Previously spawned nitro/powerups here; feature removed
    }
}

///////////////////////////////////////////////////////////////////////////////
// UI Functions
function updateScore() {
    document.getElementById('score').textContent = score;
    pulseElement('scoreHud');
}

function updateDistance() {
    document.getElementById('distance').textContent = Math.floor(distance);
}

function pulseElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 500);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

function updateComboDisplay() {
    const comboHud = document.getElementById('comboHud');
    const comboDisplay = document.getElementById('comboDisplay');
    const comboValue = document.getElementById('combo');
    const comboMultiplier = document.getElementById('comboMultiplier');
    
    if (comboCount > 1) {
        comboHud.style.display = 'flex';
        comboValue.textContent = comboCount;
        
        if (comboCount >= 5) {
            comboDisplay.classList.add('active');
            comboMultiplier.textContent = `x${comboCount}`;
        } else {
            comboDisplay.classList.remove('active');
        }
        
        pulseElement('comboHud');
    } else {
        comboHud.style.display = 'none';
        comboDisplay.classList.remove('active');
    }
}

function showLevelUp() {
    const levelUpEffect = document.getElementById('levelUpEffect');
    levelUpEffect.classList.add('show');
    
    showNotification(`LEVEL ${currentLevel}!`, 'reward');
    addCameraShake(10);
    
    setTimeout(() => {
        levelUpEffect.classList.remove('show');
    }, 2000);
}

function updateMissionCard() {
    const card = document.getElementById('missionCard');
    const objective = document.getElementById('missionObjective');
    const progress = document.getElementById('missionProgress');
    const current = document.getElementById('missionCurrent');
    const target = document.getElementById('missionTarget');
    
    objective.textContent = currentMission.description;
    current.textContent = currentMission.current;
    target.textContent = currentMission.target;
    
    const percentage = Math.min((currentMission.current / currentMission.target) * 100, 100);
    progress.style.width = percentage + '%';
    
    if (!currentMission.completed && currentMission.current >= currentMission.target) {
        currentMission.completed = true;
        completeMission();
    }
}

function showMissionCard() {
    const card = document.getElementById('missionCard');
    card.classList.add('show');
    
    setTimeout(() => {
        card.classList.remove('show');
    }, 5000);
}

function completeMission() {
    // Pause game and show mission completed popup
    pauseGame();
    
    const popup = document.getElementById('missionCompletedPopup');
    const missionText = document.getElementById('completedMissionText');
    
    missionText.textContent = currentMission.description;
    popup.classList.add('show');
    
    // Add rewards
    addXP(500);
    score += 1000;
    updateScore();
    
    // Generate new mission after delay
    setTimeout(() => {
        generateNewMission();
    }, 3000);
}

function pauseGame() {
    gamePaused = true;
    const pauseMenu = document.getElementById('pauseMenu');
    const pauseBtn = document.getElementById('pauseBtn');
    pauseMenu.classList.add('show');
    pauseBtn.textContent = '▶';
}

function resumeGame() {
    gamePaused = false;
    const pauseMenu = document.getElementById('pauseMenu');
    const pauseBtn = document.getElementById('pauseBtn');
    pauseMenu.classList.remove('show');
    pauseBtn.textContent = '⏸';
}

function generateNewMission() {
    const missionType = missionTypes[Math.floor(Math.random() * missionTypes.length)];
    const target = Math.floor(Math.random() * (missionType.max - missionType.min + 1)) + missionType.min;
    
    currentMission = {
        type: missionType.type,
        target: target,
        current: 0,
        completed: false,
        description: missionType.description.replace('{n}', target)
    };
    
    updateMissionCard();
}

function addXP(amount) {
    xp += amount;
    
    while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel;
        currentLevel++;
        xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
        showLevelUp();
        
        // Level up rewards
        player.health = Math.min(player.health + 25, 100);
        updateHealthBar();
    }
}

function updateHealthBar() {
    const healthFill = document.getElementById('healthFill');
    const wrapper = document.getElementById('healthBarWrapper');
    healthFill.style.width = player.health + '%';
    
    if (player.health < 30) {
        wrapper.classList.add('damaged');
        setTimeout(() => wrapper.classList.remove('damaged'), 500);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Game Over
function gameOver() {
    gameActive = false;
    
    // Update final stats
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalDistance').textContent = Math.floor(distance);
    document.getElementById('enemiesDestroyed').textContent = totalKills;
    document.getElementById('bestCombo').textContent = bestCombo;
    
    const gameOverEl = document.getElementById('gameOver');
    gameOverEl.classList.add('show');
}

///////////////////////////////////////////////////////////////////////////////
// Initialize Game
function initGame() {
    player = new Spaceship();
    
    // Initialize stars
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star());
    }
    
    // Generate initial mission
    generateNewMission();
    setTimeout(() => showMissionCard(), 2000);
    // Initialize nitro system
    nitroSystem = new NitroSystem(player, 1.8, 2.5);
}

///////////////////////////////////////////////////////////////////////////////
// Main Game Loop
function gameUpdate() {
    if (!gameActive || gamePaused) return;

    // Ensure boost speed is disabled
    speedBoost = 0;

    handleInput();
    
    // Update player
    player.update();
    
    // Update missiles
    missiles = missiles.filter(m => {
        m.update();
        return m.alive;
    });
    
    // Update enemies
    enemies = enemies.filter(e => {
        e.update();
        return e.alive;
    });
    
    // Update asteroids
    asteroids = asteroids.filter(a => {
        a.update();
        return a.alive;
    });
    
    // Update power-ups (movement only; nitro pickups removed)
    powerups = powerups.filter(p => {
        const moveSpeed = 8;
        p.z -= moveSpeed;
        p.rotation += 0.1;
        p.pulse += 0.15;
        return p.z >= MIN_DEPTH;
    });
    
    // Update stars
    stars.forEach(s => s.update());
    
    // Update speed lines
    updateSpeedLines();
    
    // Update combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            comboCount = 0;
            updateComboDisplay();
        }
    }
    
    // Update infinite grid
    updateGrid();
    
    // Update explosions
    updateExplosions();
    
    // Update camera shake
    updateCameraShake();

    // Update nitro system (approx dt)
    if (nitroSystem) nitroSystem.update(1 / 60);
    
    // Spawn new enemies
    spawnEnemies();
    
    // Update distance (faster during boost)
    const distanceIncrease = 1 + (speedBoost * 2);
    distance += distanceIncrease;
    updateDistance();
    
    // Mission progress - distance
    if (currentMission.type === 'surviveDistance' && !currentMission.completed) {
        currentMission.current = Math.floor(distance);
        updateMissionCard();
    }
    
    // Increase difficulty over time
    difficulty = 1 + Math.floor(distance / 500);
}

function gameRender() {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    
    // Get day/night state from HTML page (if available)
    let isDayTime = false;
    let dayTransition = 0; // 0 = full night, 1 = full day
    
    if (typeof isDay !== 'undefined' && typeof isTransitioning !== 'undefined' && typeof transitionProgress !== 'undefined') {
        if (isTransitioning) {
            // During transition, interpolate between night and day
            if (isDay) {
                // Transitioning to day (sunrise)
                dayTransition = transitionProgress;
            } else {
                // Transitioning to night (sunset)
                dayTransition = 1 - transitionProgress;
            }
        } else {
            // Stable phase
            dayTransition = isDay ? 1 : 0;
        }
    }
    
    // Dynamic background based on day/night cycle with smooth interpolation
    const intensity = 0.05 + (speedBoost * 0.1);
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    
    // Night colors
    const nightTop = { r: 10, g: 5, b: 15 + intensity * 100 };
    const nightBottom = { r: 26, g: 10, b: 42 + intensity * 100 };
    
    // Day colors
    const dayTop = { r: 135 + intensity * 50, g: 206 + intensity * 30, b: 235 + intensity * 20 };
    const dayMid = { r: 100 + intensity * 40, g: 149 + intensity * 50, b: 237 + intensity * 18 };
    const dayBottom = { r: 72 + intensity * 30, g: 118 + intensity * 40, b: 255 - intensity * 20 };
    
    // Interpolate between night and day colors
    const topColor = {
        r: nightTop.r + (dayTop.r - nightTop.r) * dayTransition,
        g: nightTop.g + (dayTop.g - nightTop.g) * dayTransition,
        b: nightTop.b + (dayTop.b - nightTop.b) * dayTransition
    };
    
    const midColor = {
        r: nightTop.r + (dayMid.r - nightTop.r) * dayTransition,
        g: nightTop.g + (dayMid.g - nightTop.g) * dayTransition,
        b: nightTop.b + (dayMid.b - nightTop.b) * dayTransition
    };
    
    const bottomColor = {
        r: nightBottom.r + (dayBottom.r - nightBottom.r) * dayTransition,
        g: nightBottom.g + (dayBottom.g - nightBottom.g) * dayTransition,
        b: nightBottom.b + (dayBottom.b - nightBottom.b) * dayTransition
    };
    
    gradient.addColorStop(0, `rgba(${Math.round(topColor.r)}, ${Math.round(topColor.g)}, ${Math.round(topColor.b)}, 1)`);
    gradient.addColorStop(0.5, `rgba(${Math.round(midColor.r)}, ${Math.round(midColor.g)}, ${Math.round(midColor.b)}, 1)`);
    gradient.addColorStop(1, `rgba(${Math.round(bottomColor.r)}, ${Math.round(bottomColor.g)}, ${Math.round(bottomColor.b)}, 1)`);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.save();

    // If boosting, apply a small zoom centered on canvas and dark vignette later
    const boosting = player && player.speedBoostActive;
    const zoomFactor = boosting ? 1.06 : 1.0; // small zoom when boosting

    // Apply camera shake and zoom
    context.translate(canvas.width / 2 + cameraShake.x, canvas.height / 2 + cameraShake.y);
    context.scale(zoomFactor, zoomFactor);
    
    // Draw stars (background)
    stars.forEach(s => s.draw(context));
    
    // Draw speed lines (during boost)
    drawSpeedLines(context);
    
    // Draw infinite perspective grid with pulse
    const gridAlpha = 0.4 + Math.sin(gridOffset * 0.01) * 0.1;
    drawInfiniteGrid(context, gridAlpha);
    
    // Sort objects by depth for proper rendering
    const allObjects = [
        ...enemies.map(e => ({ obj: e, z: e.z, type: 'enemy' })),
        ...asteroids.map(a => ({ obj: a, z: a.z, type: 'asteroid' })),
        ...powerups.map(p => ({ obj: p, z: p.z, type: 'powerup' })),
        ...missiles.map(m => ({ obj: m, z: m.z, type: 'missile' })),
        { obj: player, z: player.z, type: 'player' }
    ];
    
    allObjects.sort((a, b) => b.z - a.z);
    
    // Draw all objects in depth order
    allObjects.forEach(item => {
        item.obj.draw(context);
    });
    
    // Draw explosions (foreground)
    drawExplosions(context);
    
    // If boosting, draw dark vignette overlay to emphasize motion (canvas-based)
    if (boosting) {
        // restore context so overlay draws in screen space
        context.restore();

        // Dark translucent overlay with center highlight drawn on canvas
        context.save();
        context.fillStyle = 'rgba(0,0,0,0.45)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Clear a focused bright ellipse around the player to highlight ship motion
        context.globalCompositeOperation = 'destination-out';
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const rx = canvas.width * 0.18;
        const ry = canvas.height * 0.12;
        context.beginPath();
        context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
        context.restore();
    } else {
        context.restore();
    }

    // Draw Nitro HUD on top
    if (nitroSystem) nitroSystem.drawHUD(context);
}

///////////////////////////////////////////////////////////////////////////////
// LittleJS Integration
function gameInit() {
    try {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        // Make canvas fullscreen and responsive
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvasWidth = canvas.width;
            canvasHeight = canvas.height;
            console.log('Canvas resized:', canvas.width, 'x', canvas.height);
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
        
        initGame();
        
        // Start game loop
        setInterval(() => {
            gameUpdate();
            gameRender();
        }, 1000 / 60); // 60 FPS
        
        console.log('Game started successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, starting game...');
    gameInit();
});
