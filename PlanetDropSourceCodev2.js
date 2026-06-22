<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>プラネットドロップ (Planet Drop)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght=700;900&display=swap');

        body {
            background-color: #0b0f19;
            background-image: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%);
            font-family: 'Nunito', sans-serif;
            margin: 0;
            padding: 0;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            touch-action: none;
        }

        #game-wrapper {
            position: relative;
            width: 100%;
            max-width: 750px;
            aspect-ratio: 750 / 700;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 20px;
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.25);
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.1);
        }

        canvas {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 20px;
        }

        .ui-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
        }

        .hud-top {
            display: flex;
            justify-content: space-between;
            padding: 15px 20px;
            font-size: 20px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .next-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: rgba(15, 23, 42, 0.8);
            padding: 8px 12px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            width: 90px;
        }

        .next-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 3px;
            color: #94a3b8;
        }

        #next-planet-display {
            width: 50px;
            height: 50px;
        }

        /* スクリーン表示 */
        .screen {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(3, 7, 18, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            pointer-events: auto;
            backdrop-filter: blur(8px);
            z-index: 50;
            transition: opacity 0.3s;
        }

        .hidden {
            opacity: 0;
            pointer-events: none;
        }

        .btn {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 20px;
            font-weight: 900;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 6px 0 #1e40af, 0 10px 20px rgba(0,0,0,0.4);
            transition: transform 0.1s, box-shadow 0.1s;
            margin-top: 20px;
        }

        .btn:active {
            transform: translateY(6px);
            box-shadow: 0 0px 0 #1e40af, 0 4px 10px rgba(0,0,0,0.4);
        }

        .title {
            font-size: 40px;
            color: #3b82f6;
            text-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
            margin-bottom: 10px;
            text-align: center;
            line-height: 1.1;
            font-weight: 900;
        }
    </style>
</head>
<body>

    <div id="game-wrapper">
        <canvas id="gameCanvas" width="750" height="700"></canvas>
        
        <div class="ui-overlay">
            <div class="hud-top">
                <div>SCORE<br><span id="score-display" class="text-3xl text-blue-400">0</span></div>
                <div class="next-box">
                    <span class="next-label">NEXT</span>
                    <canvas id="next-planet-display" width="50" height="50"></canvas>
                </div>
            </div>
        </div>

        <div id="start-screen" class="screen">
            <h1 class="title">PLANET<br>DROP</h1>
            <p class="text-slate-400 mb-8 font-bold text-center px-4">広くなった宇宙で惑星を落として合体させよう！<br>太陽が重なるとブラックホールが出現！</p>
            <button class="btn" id="start-btn">START</button>
        </div>

        <div id="game-over-screen" class="screen hidden">
            <h1 class="title" style="color: #ef4444; text-shadow: 0 0 15px rgba(239, 68, 68, 0.5);">GAME OVER</h1>
            <p class="text-slate-400 text-xl font-bold mt-4">SCORE: <span id="final-score" class="text-3xl text-blue-400">0</span></p>
            <button class="btn" id="restart-btn">RETRY</button>
        </div>
    </div>

<script>
    // --- 天体（惑星）定義 ---
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

    // --- Matter.js モジュール ---
    const Engine = Matter.Engine,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Events = Matter.Events,
          Body = Matter.Body;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const GAME_WIDTH = 750;
    const GAME_HEIGHT = 700;
    const LIMIT_Y = 150; 
    
    let engine;
    let runner;
    
    // ゲーム状態
    let gameState = 'start';
    let score = 0;
    let currentPlanetLevel = 0;
    let nextPlanetLevel = 0;
    
    // 操作状態
    let pointerX = GAME_WIDTH / 2;
    let isDropping = false;
    let dropCooldown = false;
    
    let particles = [];
    let gameOverTimer = 0;
    let activeBlackHole = null;

    // --- オーディオシステム (Web Audio API) ---
    let audioCtx = null;

    function initAudio() {
        // ブラウザのセキュリティロックを解除するため、ユーザーのクリック操作時に初期化
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playDropSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'triangle'; // 柔らかいポフッという音
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    }

    function playMergeSound(level) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine'; // ピキーンという綺麗な合成音
        // レベルが上がるほど少し高い音にする
        const baseFreq = 260 + (level * 35);
        osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, audioCtx.currentTime + 0.18);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
    }

    function playBlackHoleSound() {
        if (!audioCtx) return;
        // 重厚感を出すために2つのオシレーターを組み合わせる
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.type = 'sawtooth'; // 激しいノイズ・歪み音
        osc1.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc1.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 1.5);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(105, audioCtx.currentTime);
        osc2.frequency.linearRampToValueAtTime(25, audioCtx.currentTime + 1.5);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 1.5);
        osc2.stop(audioCtx.currentTime + 1.5);
    }

    function playGameOverSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sawtooth'; // 残念なゲームオーバーの下降音
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.8);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    }

    // --- 物理エンジン初期化 ---
    function initPhysics() {
        if (engine) {
            Matter.Engine.clear(engine);
            if (runner) Matter.Runner.stop(runner);
        }

        engine = Engine.create();
        
        const wallOptions = { isStatic: true, render: { visible: false }, friction: 0.1 };
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 25, GAME_WIDTH + 100, 50, wallOptions);
        const leftWall = Bodies.rectangle(-25, GAME_HEIGHT / 2, 50, GAME_HEIGHT * 2, wallOptions);
        const rightWall = Bodies.rectangle(GAME_WIDTH + 25, GAME_HEIGHT / 2, 50, GAME_HEIGHT * 2, wallOptions);
        
        Composite.add(engine.world, [ground, leftWall, rightWall]);

        Events.on(engine, 'collisionStart', handleCollisions);
        Events.on(engine, 'afterUpdate', checkGameOver);
        Events.on(engine, 'afterUpdate', handleBlackHole);

        runner = Runner.create();
        Runner.run(runner, engine);
    }

    // --- 天体ドロップ・選定ロジック ---
    function getRandomDropLevel() {
        if (Math.random() < 0.01) {
            return 10;
        }

        const rand = Math.random();
        if (rand < 0.4) return 0; 
        if (rand < 0.7) return 1; 
        if (rand < 0.9) return 2; 
        if (rand < 0.98) return 3; 
        return 4; 
    }

    function spawnPlanet(x, y, level, isDrop = false) {
        const planetDef = PLANETS[level];
        const body = Bodies.circle(x, y, planetDef.radius, {
            restitution: 0.4, 
            friction: 0.1,
            density: 0.001,
            label: 'Planet',
            planetLevel: level,
            isMerging: false
        });
        
        if (isDrop) {
            Body.setVelocity(body, { x: 0, y: 2 });
        }
        
        Composite.add(engine.world, body);
    }

    // --- コリジョン・マージハンドラ ---
    function handleCollisions(event) {
        const pairs = event.pairs;
        const merges = [];

        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;

            if (bodyA.label === 'Planet' && bodyB.label === 'Planet') {
                if (bodyA.planetLevel === bodyB.planetLevel) {
                    if (bodyA.planetLevel < PLANETS.length - 1) {
                        if (!bodyA.isMerging && !bodyB.isMerging) {
                            bodyA.isMerging = true;
                            bodyB.isMerging = true;
                            merges.push({ a: bodyA, b: bodyB, level: bodyA.planetLevel });
                        }
                    } else if (bodyA.planetLevel === 10) {
                        if (!bodyA.isMerging && !bodyB.isMerging) {
                            bodyA.isMerging = true;
                            bodyB.isMerging = true;
                            merges.push({ a: bodyA, b: bodyB, level: 10, isBlackHole: true });
                        }
                    }
                }
            }
        }

        merges.forEach(merge => {
            const midX = (merge.a.position.x + merge.b.position.x) / 2;
            const midY = (merge.a.position.y + merge.b.position.y) / 2;

            Composite.remove(engine.world, [merge.a, merge.b]);

            if (merge.isBlackHole) {
                score += 1000; 
                document.getElementById('score-display').innerText = score;
                activeBlackHole = { x: midX, y: midY, life: 1.0, scale: 0 };
                dropCooldown = true; 
                playBlackHoleSound(); // ブラックホール効果音再生！
                return;
            }

            const newLevel = merge.level + 1;
            const newScore = PLANETS[newLevel].score;
            
            spawnPlanet(midX, midY, newLevel);
            
            score += newScore;
            document.getElementById('score-display').innerText = score;
            createMergeJuice(midX, midY, PLANETS[newLevel].color);
            playMergeSound(newLevel); // 合体効果音再生！
        });
    }

    // --- ブラックホールの重力・吸収ロジック ---
    function handleBlackHole() {
        if (!activeBlackHole) return;

        const bodies = Composite.allBodies(engine.world).filter(b => b.label === 'Planet');
        
        bodies.forEach(body => {
            const dx = activeBlackHole.x - body.position.x;
            const dy = activeBlackHole.y - body.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 0) {
                const forceMag = 0.005 * body.mass; 
                Body.applyForce(body, body.position, {
                    x: (dx / dist) * forceMag,
                    y: (dy / dist) * forceMag
                });
            }

            if (dist < 40) {
                Composite.remove(engine.world, body);
                score += PLANETS[body.planetLevel].score * 2; 
                document.getElementById('score-display').innerText = score;
                createMergeJuice(body.position.x, body.position.y, PLANETS[body.planetLevel].color);
                playMergeSound(body.planetLevel); // 吸い込まれる時にもポポポンと音が鳴る
            }
        });

        activeBlackHole.life -= 0.005; 
        activeBlackHole.scale += 0.02;

        if (activeBlackHole.life <= 0) {
            bodies.forEach(b => Composite.remove(engine.world, b));
            activeBlackHole = null;
            
            setTimeout(() => {
                if (gameState === 'playing') dropCooldown = false;
            }, 500);
        }
    }

    function checkGameOver() {
        if (gameState !== 'playing' || activeBlackHole) return;

        let isOver = false;
        const bodies = Composite.allBodies(engine.world);
        
        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];
            if (body.label === 'Planet') {
                if (body.position.y - body.circleRadius < LIMIT_Y) {
                    if (Math.abs(body.velocity.y) < 0.5 && Math.abs(body.velocity.x) < 0.5) {
                        isOver = true;
                        break;
                    }
                }
            }
        }

        if (isOver) {
            gameOverTimer++;
            if (gameOverTimer > 120) {
                endGame();
            }
        } else {
            gameOverTimer = 0;
        }
    }

    function createMergeJuice(x, y, color) {
        for(let i=0; i<8; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                radius: Math.random() * 6 + 4,
                color: color,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }

    // --- 入力ハンドラ ---
    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        }
        const scaleX = canvas.width / rect.width;
        let x = (clientX - rect.left) * scaleX;
        
        const r = PLANETS[currentPlanetLevel].radius;
        return Math.max(r + 5, Math.min(GAME_WIDTH - r - 5, x));
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
        playDropSound(); // ドロップ時の効果音再生！
        
        dropCooldown = true;
        
        setTimeout(() => {
            currentPlanetLevel = nextPlanetLevel;
            
            if (currentPlanetLevel === 10 && Math.random() < 0.5) {
                nextPlanetLevel = 10;
            } else {
                nextPlanetLevel = getRandomDropLevel();
            }
            
            updateNextPlanetUI(nextPlanetLevel);
            
            if (!activeBlackHole) {
                dropCooldown = false;
            }
        }, 1000); 
    };

    canvas.addEventListener('mousedown', triggerDrop);
    canvas.addEventListener('touchend', triggerDrop);

    // --- UI表示切り替え ---
    function startGame() {
        initAudio(); // ユーザーのボタンクリック時にオーディオコンテキストをアクティブ化
        
        score = 0;
        document.getElementById('score-display').innerText = score;
        
        currentPlanetLevel = getRandomDropLevel();
        nextPlanetLevel = getRandomDropLevel();
        updateNextPlanetUI(nextPlanetLevel);
        
        gameOverTimer = 0;
        dropCooldown = false;
        particles = [];
        activeBlackHole = null;
        
        initPhysics();
        
        gameState = 'playing';
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
    }

    function endGame() {
        gameState = 'gameover';
        document.getElementById('final-score').innerText = score;
        document.getElementById('game-over-screen').classList.remove('hidden');
        playGameOverSound(); // ゲームオーバー効果音再生！
    }

    function updateNextPlanetUI(level) {
        let container = document.getElementById('next-planet-display');
        if (!container) return;
        
        const targetCtx = container.getContext('2d');
        targetCtx.clearRect(0, 0, container.width, container.height);
        
        const pDef = PLANETS[level];
        const scale = 18 / pDef.radius; 
        
        targetCtx.save();
        targetCtx.translate(container.width / 2, container.height / 2);
        targetCtx.scale(scale, scale);
        drawPlanet(0, 0, pDef, 0, targetCtx);
        targetCtx.restore();
    }

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);

    // --- グラフィック描画ループ ---
    function draw() {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState === 'playing') {
            // レッドライン
            ctx.beginPath();
            ctx.moveTo(0, LIMIT_Y);
            ctx.lineTo(GAME_WIDTH, LIMIT_Y);
            ctx.setLineDash([10, 10]);
            
            if (gameOverTimer > 0) {
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(Date.now() / 100) * 0.5})`;
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 2;
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // ドロッププレビュー天体
            if (!dropCooldown) {
                const planetDef = PLANETS[currentPlanetLevel];
                ctx.globalAlpha = 0.5;
                drawPlanet(pointerX, 50, planetDef, 0);
                
                ctx.beginPath();
                ctx.moveTo(pointerX, 50 + planetDef.radius);
                ctx.lineTo(pointerX, GAME_HEIGHT);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.globalAlpha = 1.0;
            }

            // 物理天体
            if (engine) {
                const bodies = Composite.allBodies(engine.world);
                for (let i = 0; i < bodies.length; i++) {
                    const body = bodies[i];
                    if (body.label === 'Planet') {
                        drawPlanet(body.position.x, body.position.y, PLANETS[body.planetLevel], body.angle);
                    }
                }
            }

            // エフェクトパーティクル
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

            // 吸い込みブラックホール演出
            if (activeBlackHole) {
                ctx.save();
                ctx.translate(activeBlackHole.x, activeBlackHole.y);
                ctx.rotate(Date.now() * 0.005);
                
                const radius = Math.min(150, activeBlackHole.scale * 100);
                
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.5);
                grad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
                grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.fill();
                
                ctx.restore();
            }
        }

        requestAnimationFrame(draw);
    }

    function drawPlanet(x, y, planetDef, angle, renderCtx = ctx) {
        renderCtx.save();
        renderCtx.translate(x, y);
        renderCtx.rotate(angle);
        
        const grad = renderCtx.createRadialGradient(
            -planetDef.radius * 0.3, -planetDef.radius * 0.3, planetDef.radius * 0.1,
            0, 0, planetDef.radius
        );
        grad.addColorStop(0, planetDef.color1);
        grad.addColorStop(1, planetDef.color2);
        
        if (planetDef.name === 'Saturn') {
            renderCtx.beginPath();
            renderCtx.ellipse(0, 0, planetDef.radius * 1.8, planetDef.radius * 0.5, 20 * Math.PI/180, Math.PI, Math.PI * 2);
            renderCtx.lineWidth = planetDef.radius * 0.25;
            renderCtx.strokeStyle = '#D97706';
            renderCtx.stroke();
            renderCtx.lineWidth = planetDef.radius * 0.1;
            renderCtx.strokeStyle = '#FCD34D';
            renderCtx.stroke();
        } else if (planetDef.name === 'Uranus') {
            renderCtx.beginPath();
            renderCtx.ellipse(0, 0, planetDef.radius * 1.5, planetDef.radius * 0.3, 75 * Math.PI/180, Math.PI, Math.PI * 2);
            renderCtx.lineWidth = planetDef.radius * 0.1;
            renderCtx.strokeStyle = 'rgba(255,255,255,0.3)';
            renderCtx.stroke();
        }

        renderCtx.beginPath();
        renderCtx.arc(0, 0, planetDef.radius, 0, Math.PI * 2);
        renderCtx.fillStyle = grad;
        renderCtx.fill();
        
        renderCtx.save();
        renderCtx.clip();

        if (planetDef.name === 'Earth') {
            renderCtx.fillStyle = '#22C55E';
            renderCtx.beginPath(); renderCtx.arc(-planetDef.radius*0.3, -planetDef.radius*0.2, planetDef.radius*0.5, 0, Math.PI*2); renderCtx.fill();
            renderCtx.beginPath(); renderCtx.arc(planetDef.radius*0.4, planetDef.radius*0.3, planetDef.radius*0.6, 0, Math.PI*2); renderCtx.fill();
            renderCtx.fillStyle = 'rgba(255,255,255,0.4)';
            renderCtx.beginPath(); renderCtx.arc(-planetDef.radius*0.1, planetDef.radius*0.4, planetDef.radius*0.3, 0, Math.PI*2); renderCtx.fill();
        } else if (planetDef.name === 'Jupiter') {
            renderCtx.fillStyle = 'rgba(255,255,255,0.3)';
            renderCtx.fillRect(-planetDef.radius, -planetDef.radius*0.5, planetDef.radius*2, planetDef.radius*0.2);
            renderCtx.fillRect(-planetDef.radius, planetDef.radius*0.1, planetDef.radius*2, planetDef.radius*0.3);
            renderCtx.fillStyle = 'rgba(124, 45, 18, 0.5)';
            renderCtx.fillRect(-planetDef.radius, -planetDef.radius*0.2, planetDef.radius*2, planetDef.radius*0.15);
            renderCtx.fillStyle = '#9A3412';
            renderCtx.beginPath(); renderCtx.ellipse(planetDef.radius*0.3, 0, planetDef.radius*0.25, planetDef.radius*0.15, 0, 0, Math.PI*2); renderCtx.fill();
        } else if (planetDef.name === 'Mars') {
            renderCtx.fillStyle = 'rgba(127, 29, 29, 0.4)';
            renderCtx.beginPath(); renderCtx.arc(-planetDef.radius*0.2, planetDef.radius*0.3, planetDef.radius*0.4, 0, Math.PI*2); renderCtx.fill();
            renderCtx.beginPath(); renderCtx.arc(planetDef.radius*0.3, -planetDef.radius*0.2, planetDef.radius*0.3, 0, Math.PI*2); renderCtx.fill();
        } else if (planetDef.name === 'Moon' || planetDef.name === 'Mercury') {
            renderCtx.fillStyle = 'rgba(0,0,0,0.15)';
            renderCtx.beginPath(); renderCtx.arc(-planetDef.radius*0.3, -planetDef.radius*0.2, planetDef.radius*0.2, 0, Math.PI*2); renderCtx.fill();
            renderCtx.beginPath(); renderCtx.arc(planetDef.radius*0.4, planetDef.radius*0.3, planetDef.radius*0.25, 0, Math.PI*2); renderCtx.fill();
            renderCtx.beginPath(); renderCtx.arc(-planetDef.radius*0.1, planetDef.radius*0.4, planetDef.radius*0.15, 0, Math.PI*2); renderCtx.fill();
        } else if (planetDef.name === 'Venus') {
            renderCtx.fillStyle = 'rgba(255,255,255,0.2)';
            renderCtx.fillRect(-planetDef.radius, -planetDef.radius*0.3, planetDef.radius*2, planetDef.radius*0.1);
            renderCtx.fillRect(-planetDef.radius, planetDef.radius*0.2, planetDef.radius*2, planetDef.radius*0.15);
        } else if (planetDef.name === 'Neptune') {
            renderCtx.fillStyle = 'rgba(255,255,255,0.1)';
            renderCtx.fillRect(-planetDef.radius, -planetDef.radius*0.2, planetDef.radius*2, planetDef.radius*0.1);
            renderCtx.fillStyle = 'rgba(0,0,0,0.15)';
            renderCtx.beginPath(); renderCtx.ellipse(-planetDef.radius*0.2, planetDef.radius*0.2, planetDef.radius*0.25, planetDef.radius*0.15, 0, 0, Math.PI*2); renderCtx.fill();
        } else if (planetDef.name === 'Pluto') {
            renderCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            renderCtx.beginPath(); renderCtx.arc(planetDef.radius*0.15, planetDef.radius*0.1, planetDef.radius*0.4, 0, Math.PI*2); renderCtx.fill();
        }

        renderCtx.restore();

        if (planetDef.name === 'Saturn') {
            renderCtx.beginPath();
            renderCtx.ellipse(0, 0, planetDef.radius * 1.8, planetDef.radius * 0.5, 20 * Math.PI/180, 0, Math.PI);
            renderCtx.lineWidth = planetDef.radius * 0.25;
            renderCtx.strokeStyle = '#D97706';
            renderCtx.stroke();
            renderCtx.lineWidth = planetDef.radius * 0.1;
            renderCtx.strokeStyle = '#FCD34D';
            renderCtx.stroke();
        } else if (planetDef.name === 'Uranus') {
            renderCtx.beginPath();
            renderCtx.ellipse(0, 0, planetDef.radius * 1.5, planetDef.radius * 0.3, 75 * Math.PI/180, 0, Math.PI);
            renderCtx.lineWidth = planetDef.radius * 0.1;
            renderCtx.strokeStyle = 'rgba(255,255,255,0.3)';
            renderCtx.stroke();
        }

        if (planetDef.name === 'Sun') {
            renderCtx.beginPath();
            renderCtx.arc(0, 0, planetDef.radius * 1.3, 0, Math.PI * 2);
            const glow = renderCtx.createRadialGradient(0, 0, planetDef.radius, 0, 0, planetDef.radius * 1.3);
            glow.addColorStop(0, 'rgba(250, 204, 21, 0.6)');
            glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
            renderCtx.fillStyle = glow;
            renderCtx.fill();
        }
        
        renderCtx.restore();
    }

    requestAnimationFrame(draw);

</script>
</body>
</html>