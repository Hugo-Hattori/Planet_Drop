<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Planet Drop</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
    <style>
        body {
            background-color: #050510;
            color: white;
            font-family: 'Inter', sans-serif;
            overflow: hidden;
            touch-action: none;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-image: radial-gradient(circle at center, #1a1a3a 0%, #050510 100%);
        }

        #game-wrapper {
            position: relative;
            width: 100%;
            max-width: 600px;
            aspect-ratio: 600 / 700;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255,255,255,0.05);
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }

        canvas {
            display: block;
            width: 100%;
            height: 100%;
        }

        .ui-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .top-bar {
            padding: 15px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
        }

        .score-box {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
            padding: 10px 20px;
            border-radius: 15px;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }

        .next-box {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
            padding: 10px;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .next-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9CA3AF;
            margin-bottom: 5px;
        }

        #next-planet-display {
            font-size: 32px;
            line-height: 1;
            text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }

        /* The danger line */
        #danger-line {
            position: absolute;
            top: 150px; 
            left: 0;
            width: 100%;
            height: 2px;
            background: repeating-linear-gradient(
                90deg,
                rgba(239, 68, 68, 0.5),
                rgba(239, 68, 68, 0.5) 10px,
                transparent 10px,
                transparent 20px
            );
            z-index: 10;
        }

        .screen {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(5, 5, 16, 0.9);
            backdrop-filter: blur(8px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            pointer-events: auto;
            z-index: 50;
        }

        .hidden { display: none !important; }

        .btn {
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 30px;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
            transition: transform 0.1s, box-shadow 0.1s;
        }
        .btn:active {
            transform: scale(0.95);
            box-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);
        }
        
        .title-text {
            font-size: 3rem;
            font-weight: 900;
            background: linear-gradient(to right, #60A5FA, #C084FC);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 2rem;
            text-shadow: 0 0 20px rgba(192, 132, 252, 0.5);
        }
    </style>
</head>
<body>

    <div id="game-wrapper">
        <canvas id="gameCanvas" width="600" height="700"></canvas>
        <div id="danger-line"></div>
        
        <div class="ui-overlay">
            <div class="top-bar">
                <div class="score-box">
                    Score: <span id="score-display">0</span>
                </div>
                <div class="next-box">
                    <span class="next-label">Next</span>
                    <span id="next-planet-display">🌑</span>
                </div>
            </div>
        </div>

        <div id="start-screen" class="screen">
            <h1 class="title-text">PLANET DROP</h1>
            <p class="mb-8 text-gray-300 text-center max-w-xs">
                Tap to drop planets.<br>Merge matching planets to build the Sun!<br>Don't let them stack past the red line.
            </p>
            <button class="btn" onclick="startGame()">START MISSION</button>
        </div>

        <div id="game-over-screen" class="screen hidden">
            <h1 class="text-4xl font-bold text-red-500 mb-2">SYSTEM COLLAPSE</h1>
            <p class="mb-8 text-xl text-gray-300">Final Score: <span id="final-score" class="font-bold text-white">0</span></p>
            <button class="btn" onclick="startGame()">TRY AGAIN</button>
        </div>
    </div>

<script>
    // --- PLANET DEFINITIONS ---
    const PLANETS = [
        { level: 0,  name: 'Pluto',     radius: 16,  color1: '#F5D0B5', color2: '#8B5A2B', color: '#D29B73', emoji: '🌑', score: 1 },
        { level: 1,  name: 'Moon',      radius: 24,  color1: '#F8FAFC', color2: '#475569', color: '#94A3B8', emoji: '🌕', score: 3 },
        { level: 2,  name: 'Mercury',   radius: 34,  color1: '#A8A29E', color2: '#44403C', color: '#6B7280', emoji: '🪨', score: 6 },
        { level: 3,  name: 'Mars',      radius: 46,  color1: '#FCA5A5', color2: '#7F1D1D', color: '#EF4444', emoji: '🔴', score: 10 },
        { level: 4,  name: 'Venus',     radius: 58,  color1: '#FDE047', color2: '#92400E', color: '#FBBF24', emoji: '🟡', score: 15 },
        { level: 5,  name: 'Earth',     radius: 72,  color1: '#60A5FA', color2: '#1E3A8A', color: '#3B82F6', emoji: '🌍', score: 21 },
        { level: 6,  name: 'Neptune',   radius: 88,  color1: '#38BDF8', color2: '#1D4ED8', color: '#0EA5E9', emoji: '🔵', score: 28 },
        { level: 7,  name: 'Uranus',    radius: 106, color1: '#A5F3FC', color2: '#0E7490', color: '#06B6D4', emoji: '🧊', score: 36 },
        { level: 8,  name: 'Saturn',    radius: 126, color1: '#FDE047', color2: '#A16207', color: '#F59E0B', emoji: '🪐', score: 45 },
        { level: 9,  name: 'Jupiter',   radius: 148, color1: '#FDBA74', color2: '#7C2D12', color: '#EA580C', emoji: '🟠', score: 55 },
        { level: 10, name: 'Sun',       radius: 172, color1: '#FEF08A', color2: '#EA580C', color: '#EAB308', emoji: '☀️', score: 66 }
    ];

    // --- GAME ENGINE SETUP ---
    const Engine = Matter.Engine,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Events = Matter.Events,
          Body = Matter.Body;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const GAME_WIDTH = 600;
    const GAME_HEIGHT = 700;
    const LIMIT_Y = 150; // Game over line
    
    let engine;
    let runner;
    
    // Game State
    let gameState = 'start'; // start, playing, gameover
    let score = 0;
    let currentPlanetLevel = 0;
    let nextPlanetLevel = 0;
    
    // Interaction state
    let pointerX = GAME_WIDTH / 2;
    let isDropping = false;
    let dropCooldown = false;
    
    let particles = [];
    let gameOverTimer = 0;
    let activeBlackHole = null;

    // --- INITIALIZATION ---
    function initPhysics() {
        if (engine) {
            Matter.Engine.clear(engine);
            if (runner) Matter.Runner.stop(runner);
        }

        engine = Engine.create();
        
        // Boundaries (Left, Right, Bottom)
        const wallOptions = { isStatic: true, render: { visible: false }, friction: 0.1 };
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 25, GAME_WIDTH + 100, 50, wallOptions);
        const leftWall = Bodies.rectangle(-25, GAME_HEIGHT / 2, 50, GAME_HEIGHT * 2, wallOptions);
        const rightWall = Bodies.rectangle(GAME_WIDTH + 25, GAME_HEIGHT / 2, 50, GAME_HEIGHT * 2, wallOptions);
        
        Composite.add(engine.world, [ground, leftWall, rightWall]);

        // Collision Events (Merging)
        Events.on(engine, 'collisionStart', handleCollisions);
        
        // Game Over check
        Events.on(engine, 'afterUpdate', checkGameOver);
        
        // Black Hole logic
        Events.on(engine, 'afterUpdate', handleBlackHole);

        runner = Runner.create();
        Runner.run(runner, engine);
    }

    // --- LOGIC ---
    let forceNextSun = false;

    function getRandomDropLevel() {
        if (forceNextSun) {
            forceNextSun = false;
            return 10; 
        }

        const rand = Math.random();
        // 1% chance of Sun (level 10)
        if (rand < 0.01) {
            // If we get a Sun, 50% chance the NEXT one is also a Sun
            if (Math.random() < 0.5) {
                forceNextSun = true;
            }
            return 10; 
        }
        
        // 99% chance distributed amongst levels 0 to 4
        const subRand = Math.random();
        if (subRand < 0.4) return 0;
        if (subRand < 0.7) return 1;
        if (subRand < 0.9) return 2;
        if (subRand < 0.98) return 3;
        return 4;
    }

    function spawnPlanet(x, y, level, isDrop = false) {
        const planetDef = PLANETS[level];
        const body = Bodies.circle(x, y, planetDef.radius, {
            restitution: 0.4, // Bounciness
            friction: 0.1,
            density: 0.001,
            label: 'Planet',
            planetLevel: level, // Custom property
            isMerging: false   // Lock to prevent double merging
        });
        
        if (isDrop) {
            // Slight downward velocity on drop
            Body.setVelocity(body, { x: 0, y: 2 });
        }

        Composite.add(engine.world, body);
    }

    function handleCollisions(event) {
        const pairs = event.pairs;
        const merges = [];

        // Identify merges in this frame
        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;

            if (bodyA.label === 'Planet' && bodyB.label === 'Planet') {
                if (bodyA.planetLevel === bodyB.planetLevel) {
                    if (bodyA.planetLevel < PLANETS.length - 1) {
                        // Prevent same body from merging twice in one frame
                        if (!bodyA.isMerging && !bodyB.isMerging) {
                            bodyA.isMerging = true;
                            bodyB.isMerging = true;
                            merges.push({ a: bodyA, b: bodyB, level: bodyA.planetLevel });
                        }
                    } else if (bodyA.planetLevel === 10) {
                        // Merging two Suns! Trigger Black Hole!
                        if (!bodyA.isMerging && !bodyB.isMerging) {
                            bodyA.isMerging = true;
                            bodyB.isMerging = true;
                            merges.push({ a: bodyA, b: bodyB, level: 10, isBlackHole: true });
                        }
                    }
                }
            }
        }

        // Process merges
        merges.forEach(merge => {
            const midX = (merge.a.position.x + merge.b.position.x) / 2;
            const midY = (merge.a.position.y + merge.b.position.y) / 2;

            // Remove old bodies
            Composite.remove(engine.world, [merge.a, merge.b]);

            // Handle Black Hole Trigger
            if (merge.isBlackHole) {
                score += 1000; // Massive bonus for achieving a Black Hole
                document.getElementById('score-display').innerText = score;
                activeBlackHole = { x: midX, y: midY, life: 1.0, scale: 0 };
                dropCooldown = true; // Lock dropping during cinematic
                return; // Skip spawning new planet
            }

            const newLevel = merge.level + 1;
            const newScore = PLANETS[newLevel].score;
            
            // Add new body
            spawnPlanet(midX, midY, newLevel);
            
            // Update Score & Juice
            score += newScore;
            document.getElementById('score-display').innerText = score;
            createMergeJuice(midX, midY, PLANETS[newLevel].color);
        });
    }

    function checkGameOver() {
        // Prevent game over from triggering while planets are flying into the black hole
        if (gameState !== 'playing' || activeBlackHole) return;

        let isOver = false;
        const bodies = Composite.allBodies(engine.world);
        
        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];
            if (body.label === 'Planet') {
                // If body is above line and practically stopped
                if (body.position.y - PLANETS[body.planetLevel].radius < LIMIT_Y) {
                    if (Math.abs(body.velocity.y) < 0.5 && Math.abs(body.velocity.x) < 0.5) {
                        isOver = true;
                        break;
                    }
                }
            }
        }

        if (isOver) {
            gameOverTimer++;
            if (gameOverTimer > 120) { // Approx 2 seconds of resting above line
                endGame();
            }
        } else {
            gameOverTimer = 0; // Reset if planet settles back down
        }
    }

    function handleBlackHole() {
        if (!activeBlackHole) return;

        const bodies = Composite.allBodies(engine.world).filter(b => b.label === 'Planet');
        
        bodies.forEach(body => {
            const dx = activeBlackHole.x - body.position.x;
            const dy = activeBlackHole.y - body.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Apply aggressive gravitational pull
            if (dist > 0) {
                const forceMag = 0.005 * body.mass; 
                Body.applyForce(body, body.position, {
                    x: (dx / dist) * forceMag,
                    y: (dy / dist) * forceMag
                });
            }

            // Suck it in if close enough to the event horizon
            if (dist < 40) {
                Composite.remove(engine.world, body);
                score += PLANETS[body.planetLevel].score * 2; // Double points for sucked planets!
                document.getElementById('score-display').innerText = score;
                createMergeJuice(body.position.x, body.position.y, PLANETS[body.planetLevel].color);
            }
        });

        activeBlackHole.life -= 0.005; // Lasts approx 3-4 seconds
        activeBlackHole.scale += 0.02;

        // End Black Hole Sequence
        if (activeBlackHole.life <= 0) {
            bodies.forEach(b => Composite.remove(engine.world, b)); // Clear any stragglers
            activeBlackHole = null;
            
            // Allow the player to drop planets again
            setTimeout(() => {
                if (gameState === 'playing') dropCooldown = false;
            }, 500);
        }
    }

    function createMergeJuice(x, y, color) {
        for(let i=0; i<8; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                radius: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.02
            });
        }
    }

    // --- INPUT HANDLING ---
    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        // Scale handles if css size is different from canvas attributes
        const scaleX = canvas.width / rect.width;
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let x = (clientX - rect.left) * scaleX;
        
        // Clamp to edges considering planet radius
        const radius = PLANETS[currentPlanetLevel].radius;
        return Math.max(radius, Math.min(GAME_WIDTH - radius, x));
    }

    canvas.addEventListener('mousemove', (e) => {
        if (gameState === 'playing' && !dropCooldown) pointerX = getPointerPos(e);
    });

    canvas.addEventListener('touchmove', (e) => {
        if (gameState === 'playing' && !dropCooldown) pointerX = getPointerPos(e);
    });

    const triggerDrop = (e) => {
        if (gameState !== 'playing' || dropCooldown) return;
        if (e) e.preventDefault();
        
        spawnPlanet(pointerX, 50, currentPlanetLevel, true);
        
        dropCooldown = true;
        
        // Setup next planet
        setTimeout(() => {
            currentPlanetLevel = nextPlanetLevel;
            nextPlanetLevel = getRandomDropLevel();
            document.getElementById('next-planet-display').innerText = PLANETS[nextPlanetLevel].emoji;
            
            // Only release cooldown if a black hole isn't currently active
            if (!activeBlackHole) {
                dropCooldown = false;
            }
        }, 1000); // 1 second cooldown
    };

    canvas.addEventListener('mousedown', triggerDrop);
    canvas.addEventListener('touchstart', triggerDrop, {passive: false});

    // --- UI LOGIC ---
    function startGame() {
        score = 0;
        document.getElementById('score-display').innerText = score;
        
        forceNextSun = false; // Reset the Sun forced flag

        // Random starting planets
        currentPlanetLevel = getRandomDropLevel();
        nextPlanetLevel = getRandomDropLevel();
        document.getElementById('next-planet-display').innerText = PLANETS[nextPlanetLevel].emoji;
        
        gameOverTimer = 0;
        dropCooldown = false;
        particles = [];
        activeBlackHole = null;
        
        initPhysics();
        
        gameState = 'playing';
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Start Render Loop if not already running
        if(!window.isRendering) {
            window.isRendering = true;
            draw();
        }
    }

    function endGame() {
        gameState = 'gameover';
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').innerText = score;
    }

    // --- RENDER LOOP ---
    function drawPlanet(x, y, planetDef, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // 1. 3D Sphere Gradient
        const grad = ctx.createRadialGradient(
            -planetDef.radius * 0.3, -planetDef.radius * 0.3, planetDef.radius * 0.1,
            0, 0, planetDef.radius
        );
        grad.addColorStop(0, planetDef.color1);
        grad.addColorStop(1, planetDef.color2);
        
        // 2. Draw BACK rings (behind the planet)
        if (planetDef.name === 'Saturn') {
            ctx.beginPath();
            ctx.ellipse(0, 0, planetDef.radius * 1.8, planetDef.radius * 0.5, 20 * Math.PI/180, Math.PI, Math.PI * 2);
            ctx.lineWidth = planetDef.radius * 0.25;
            ctx.strokeStyle = '#D97706';
            ctx.stroke();
            ctx.lineWidth = planetDef.radius * 0.1;
            ctx.strokeStyle = '#FCD34D';
            ctx.stroke();
        } else if (planetDef.name === 'Uranus') {
            ctx.beginPath();
            ctx.ellipse(0, 0, planetDef.radius * 1.5, planetDef.radius * 0.3, 75 * Math.PI/180, Math.PI, Math.PI * 2);
            ctx.lineWidth = planetDef.radius * 0.1;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.stroke();
        }

        // 3. Base Planet Sphere
        ctx.beginPath();
        ctx.arc(0, 0, planetDef.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // 4. Planet-specific details (clipped to the circle so they don't draw outside)
        ctx.save();
        ctx.clip();

        if (planetDef.name === 'Earth') {
            ctx.fillStyle = '#22C55E';
            ctx.beginPath(); ctx.arc(-planetDef.radius*0.3, -planetDef.radius*0.2, planetDef.radius*0.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(planetDef.radius*0.4, planetDef.radius*0.3, planetDef.radius*0.6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; // Clouds
            ctx.beginPath(); ctx.arc(-planetDef.radius*0.1, planetDef.radius*0.4, planetDef.radius*0.3, 0, Math.PI*2); ctx.fill();
        } else if (planetDef.name === 'Jupiter') {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(-planetDef.radius, -planetDef.radius*0.5, planetDef.radius*2, planetDef.radius*0.2);
            ctx.fillRect(-planetDef.radius, planetDef.radius*0.1, planetDef.radius*2, planetDef.radius*0.3);
            ctx.fillStyle = 'rgba(124, 45, 18, 0.5)';
            ctx.fillRect(-planetDef.radius, -planetDef.radius*0.2, planetDef.radius*2, planetDef.radius*0.15);
            ctx.fillStyle = '#9A3412'; // Great Red Spot
            ctx.beginPath(); ctx.ellipse(planetDef.radius*0.3, 0, planetDef.radius*0.25, planetDef.radius*0.15, 0, 0, Math.PI*2); ctx.fill();
        } else if (planetDef.name === 'Mars') {
            ctx.fillStyle = 'rgba(127, 29, 29, 0.4)';
            ctx.beginPath(); ctx.arc(-planetDef.radius*0.2, planetDef.radius*0.3, planetDef.radius*0.4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(planetDef.radius*0.3, -planetDef.radius*0.2, planetDef.radius*0.3, 0, Math.PI*2); ctx.fill();
        } else if (planetDef.name === 'Moon' || planetDef.name === 'Mercury') {
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; // Craters
            ctx.beginPath(); ctx.arc(-planetDef.radius*0.3, -planetDef.radius*0.2, planetDef.radius*0.2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(planetDef.radius*0.4, planetDef.radius*0.3, planetDef.radius*0.25, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(-planetDef.radius*0.1, planetDef.radius*0.4, planetDef.radius*0.15, 0, Math.PI*2); ctx.fill();
        } else if (planetDef.name === 'Venus') {
            ctx.fillStyle = 'rgba(255,255,255,0.2)'; // Atmospheric bands
            ctx.fillRect(-planetDef.radius, -planetDef.radius*0.3, planetDef.radius*2, planetDef.radius*0.1);
            ctx.fillRect(-planetDef.radius, planetDef.radius*0.2, planetDef.radius*2, planetDef.radius*0.15);
        } else if (planetDef.name === 'Neptune') {
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(-planetDef.radius, -planetDef.radius*0.2, planetDef.radius*2, planetDef.radius*0.1);
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; // Dark spot
            ctx.beginPath(); ctx.ellipse(-planetDef.radius*0.2, planetDef.radius*0.2, planetDef.radius*0.25, planetDef.radius*0.15, 0, 0, Math.PI*2); ctx.fill();
        } else if (planetDef.name === 'Pluto') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Brighter Tombaugh Regio (Heart)
            ctx.beginPath(); ctx.arc(planetDef.radius*0.15, planetDef.radius*0.1, planetDef.radius*0.4, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore(); // Remove clip

        // 5. Draw FRONT rings
        if (planetDef.name === 'Saturn') {
            ctx.beginPath();
            ctx.ellipse(0, 0, planetDef.radius * 1.8, planetDef.radius * 0.5, 20 * Math.PI/180, 0, Math.PI);
            ctx.lineWidth = planetDef.radius * 0.25;
            ctx.strokeStyle = '#D97706';
            ctx.stroke();
            ctx.lineWidth = planetDef.radius * 0.1;
            ctx.strokeStyle = '#FCD34D';
            ctx.stroke();
        } else if (planetDef.name === 'Uranus') {
            ctx.beginPath();
            ctx.ellipse(0, 0, planetDef.radius * 1.5, planetDef.radius * 0.3, 75 * Math.PI/180, 0, Math.PI);
            ctx.lineWidth = planetDef.radius * 0.1;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.stroke();
        }

        // 6. Draw Sun glow & coronal flares
        if (planetDef.name === 'Sun') {
            ctx.beginPath();
            ctx.arc(0, 0, planetDef.radius * 1.3, 0, Math.PI * 2);
            const glow = ctx.createRadialGradient(0, 0, planetDef.radius, 0, 0, planetDef.radius * 1.3);
            glow.addColorStop(0, 'rgba(250, 204, 21, 0.6)');
            glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
            ctx.fillStyle = glow;
            ctx.fill();
        }
        
        ctx.restore();
    }

    function draw() {
        // Clear Canvas
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState === 'playing' || gameState === 'gameover') {
            
            // Draw Dropper Guide
            if (gameState === 'playing' && !dropCooldown) {
                const currentDef = PLANETS[currentPlanetLevel];
                
                // Ghost planet
                ctx.globalAlpha = 0.5;
                drawPlanet(pointerX, 50, currentDef, 0);
                ctx.globalAlpha = 1.0;
                
                // Drop Line
                ctx.beginPath();
                ctx.setLineDash([5, 10]);
                ctx.moveTo(pointerX, 50 + currentDef.radius);
                ctx.lineTo(pointerX, GAME_HEIGHT);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw Physics Bodies
            const bodies = Composite.allBodies(engine.world);
            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (body.label === 'Planet') {
                    const planetDef = PLANETS[body.planetLevel];
                    drawPlanet(body.position.x, body.position.y, planetDef, body.angle);
                }
            }

            // Draw Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.globalAlpha = 1.0;

                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) particles.splice(i, 1);
            }

            // Draw Black Hole Event
            if (activeBlackHole) {
                ctx.save();
                ctx.translate(activeBlackHole.x, activeBlackHole.y);
                ctx.rotate(Date.now() * 0.005); // Spin the black hole
                
                const radius = Math.min(150, activeBlackHole.scale * 100);
                
                // Accretion disk
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.5);
                grad.addColorStop(0, 'rgba(168, 85, 247, 0.9)'); // Purple inner glow
                grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)'); // Blue middle glow
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fill();

                // Event horizon
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 20;
                ctx.fill();
                
                ctx.restore();
            }
        }

        requestAnimationFrame(draw);
    }
</script>
</body>
</html>