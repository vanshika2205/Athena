import React, { useState, useEffect, useRef } from 'react';
import HUD from './components/HUD';
import HudActions from './components/HudActions';
import VolumePopover from './components/VolumePopover';
import SkinsShopModal from './components/SkinsShopModal';
import LeaderboardModal from './components/LeaderboardModal';
import MemeVideoPopup from './components/MemeVideoPopup';
import './App.css';

const CONFIG = {
    bgMusicUrl: "assets/bg-music.mp3",
    characters: [
        {
            id: "felix",
            name: "Felix",
            image: "assets/ishu.png", // Adventurer skin fallback
            cost: 0,
            desc: "Standard student. Just trying to survive.",
            buff: "No extra bonuses."
        },
        {
            id: "gigachad",
            name: "GigaChad",
            image: "assets/manish.png",
            cost: 50,
            desc: "Brawn over books. Shield duration is +4s longer.",
            buff: "Shield Duration: +4 seconds"
        },
        {
            id: "sigma",
            name: "Sigma Wolf",
            image: "assets/batra.png",
            cost: 100,
            desc: "Lone wolf grind. Moves 15% faster sideways.",
            buff: "Movement Speed: +15%"
        },
        {
            id: "modiji",
            name: "Modi Ji",
            image: "assets/image.png",
            cost: 200,
            desc: "Mitron! Multiplies all scores by 1.5x.",
            buff: "Score Multiplier: 1.5x"
        },
        {
            id: "rahul",
            name: "Rahul Gandhi",
            image: "assets/rahul.png",
            cost: 200,
            desc: "Alloo to Sona converter. Magnet duration +5s.",
            buff: "Magnet Duration: +5 seconds"
        }
    ],
    enemyImages: [
        "https://api.dicebear.com/7.x/bottts/svg?seed=1",
        "https://api.dicebear.com/7.x/bottts/svg?seed=2",
        "https://api.dicebear.com/7.x/bottts/svg?seed=3"
    ],
    enemyLabels: [
        "Mid Term 1", 
        "Internal Prac", 
        "Mid Term 2", 
        "External Prac", 
        "PBL", 
        "Projects", 
        "Assignments", 
        "Externals"
    ],
    level2EnemyImages: [
        "https://media1.tenor.com/m/cgYqBjzKDG0AAAAd/dance-dancing.gif",
        "assets/image.png"
    ],
    level3EnemyImages: [ "assets/rahul.png" ],
    level4EnemyImages: [ "assets/teacher1.png" ],
    level5EnemyImages: [ "assets/teacher2.png" ],
    level6EnemyImages: [ "assets/teacher3.png" ],

    gameOverVideo1: "https://www.youtube.com/embed/XKv5U3o63Vs",
    gameOverVideo2: "https://www.youtube.com/embed/msLWM-fn9PQ",
    gameOverVideo3: "https://www.youtube.com/embed/KVkm3SL34NY",
    gameOverVideo4: "assets/WhatsApp Video 2026-04-18 at 11.22.34.mp4",
    gameOverVideo5: "assets/chee.mp4",
    gameOverVideo6: "https://www.youtube.com/embed/JxZpLg5w7Eo",

    levelUpTexts: [
        "LEVEL UP!",
        "STONKS! 📈",
        "GIGACHAD LEVEL! 🗿",
        "SIGMA GRINDSET! 🐺",
        "ACHHE DIN! ✨",
        "MITRON! 🙏"
    ]
};

export default function App() {
    // 1. React States for overlays and stats updates
    const [gameState, setGameState] = useState('START'); // START, PLAYING, PAUSED, GAMEOVER
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [coins, setCoins] = useState(0);

    // Persisted configurations
    const [selectedChar, setSelectedChar] = useState('felix');
    const [ownedChars, setOwnedChars] = useState(['felix']);
    const [leaderboard, setLeaderboard] = useState([]);
    
    // Modal controls
    const [showShop, setShowShop] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [sfxVolume, setSfxVolume] = useState(0.5);

    // High Score inline save states
    const [isHighScoreEligible, setIsHighScoreEligible] = useState(false);
    const [playerName, setPlayerName] = useState('');

    // Troll video states
    const [showVideo, setShowVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    // Power-up active states for HUD visual indicator toggles
    const [powerupsActive, setPowerupsActive] = useState({
        shield: false,
        magnet: false,
        nitro: false,
        double: false
    });

    // 2. Refs for high-frequency gameplay loop calculations
    const gameAreaRef = useRef(null);
    const roadBoardRef = useRef(null);
    const bgMusicRef = useRef(null);
    const audioCtxRef = useRef(null);

    const playerRef = useRef({
        x: 0,
        y: 0,
        width: 65,
        height: 65,
        speed: 6,
        score: 0,
        level: 1,
        currentLane: 1,
        nitroMultiplier: 1
    });

    const itemsRef = useRef({
        enemies: [],
        coins: [],
        powerups: [],
        lines: []
    });

    const activePowerupsRef = useRef({
        shield: { active: false, timeRemaining: 0, duration: 8000 },
        magnet: { active: false, timeRemaining: 0, duration: 8000 },
        nitro: { active: false, timeRemaining: 0, duration: 5000 },
        double: { active: false, timeRemaining: 0, duration: 10000 }
    });

    // Inputs listener keys
    const keysRef = useRef({ ArrowLeft: false, ArrowRight: false });

    // Audio SFX synthesis helper
    const playTone = (freq, type, duration, vol) => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(vol * sfxVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    };

    const playStartSnd = () => {
        playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(800, 'sine', 0.2, 0.1), 150);
    };
    const playCrashSnd = () => {
        playTone(150, 'sawtooth', 0.5, 0.2);
        setTimeout(() => playTone(100, 'square', 0.3, 0.2), 100);
    };
    const playLevelUpSnd = () => {
        playTone(440, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(554, 'sine', 0.1, 0.1), 100);
        setTimeout(() => playTone(659, 'sine', 0.3, 0.1), 200);
        setTimeout(() => playTone(880, 'square', 0.6, 0.1), 300);
    };
    const playCoinSnd = () => { playTone(987.77, 'sine', 0.12, 0.08); };
    const playPowerupSnd = () => {
        playTone(523.25, 'triangle', 0.1, 0.1);
        setTimeout(() => playTone(659.25, 'triangle', 0.1, 0.1), 100);
        setTimeout(() => playTone(783.99, 'triangle', 0.3, 0.1), 200);
    };

    // Load Saved Data
    useEffect(() => {
        try {
            const savedCoins = localStorage.getItem('engi_coins');
            if (savedCoins) setCoins(parseInt(savedCoins));

            const savedChar = localStorage.getItem('engi_selected_char');
            if (savedChar) setSelectedChar(savedChar);

            const savedOwned = localStorage.getItem('engi_owned_chars');
            if (savedOwned) setOwnedChars(JSON.parse(savedOwned));

            const savedBoard = localStorage.getItem('engi_leaderboard');
            if (savedBoard) setLeaderboard(JSON.parse(savedBoard));

            const savedVolMusic = localStorage.getItem('engi_music_volume');
            if (savedVolMusic) setMusicVolume(parseFloat(savedVolMusic));

            const savedVolSfx = localStorage.getItem('engi_sfx_volume');
            if (savedVolSfx) setSfxVolume(parseFloat(savedVolSfx));
        } catch(e) {}
    }, []);

    // Apply background music volume adjustments
    useEffect(() => {
        if (bgMusicRef.current) {
            bgMusicRef.current.volume = musicVolume;
        }
        localStorage.setItem('engi_music_volume', musicVolume);
    }, [musicVolume]);

    useEffect(() => {
        localStorage.setItem('engi_sfx_volume', sfxVolume);
    }, [sfxVolume]);

    // Keyboard Inputs registration
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameState !== 'PLAYING') return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                changeLane(-1);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                changeLane(1);
            }
            if (e.key.toLowerCase() === 'p') {
                togglePause();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    // Lane switches
    const changeLane = (dir) => {
        let newLane = playerRef.current.currentLane + dir;
        if (newLane >= 0 && newLane <= 2) {
            playerRef.current.currentLane = newLane;
            playTone(300, 'sine', 0.05, 0.05);
        }
    };

    // Pause game
    const togglePause = () => {
        if (gameState === 'PLAYING') {
            setGameState('PAUSED');
            if (bgMusicRef.current) bgMusicRef.current.pause();
        } else if (gameState === 'PAUSED') {
            setGameState('PLAYING');
            if (bgMusicRef.current) bgMusicRef.current.play().catch(() => {});
        }
    };

    // Main Init startGame
    const startGame = () => {
        playStartSnd();

        if (bgMusicRef.current) {
            bgMusicRef.current.src = CONFIG.bgMusicUrl;
            bgMusicRef.current.currentTime = 0;
            bgMusicRef.current.volume = musicVolume;
            bgMusicRef.current.play().catch(() => {});
        }

        // Clean road divs
        if (roadBoardRef.current) {
            roadBoardRef.current.querySelectorAll('.lines, .enemy, .player-wrapper, .coin, .powerup-item').forEach(e => e.remove());
        }

        // Reset state values
        setScore(0);
        setLevel(1);
        setIsHighScoreEligible(false);
        setShowVideo(false);
        setVideoUrl('');

        playerRef.current = {
            x: 0,
            y: 0,
            width: 65,
            height: 65,
            speed: 6,
            score: 0,
            level: 1,
            currentLane: 1,
            nitroMultiplier: 1
        };

        itemsRef.current = { enemies: [], coins: [], powerups: [], lines: [] };
        
        // Reset active timers
        for (let key in activePowerupsRef.current) {
            activePowerupsRef.current[key].active = false;
            activePowerupsRef.current[key].timeRemaining = 0;
        }
        setPowerupsActive({ shield: false, magnet: false, nitro: false, double: false });

        setGameState('PLAYING');

        // Draw initial components
        createLanes();

        // Spawn player wrap
        const activeChar = CONFIG.characters.find(c => c.id === selectedChar) || CONFIG.characters[0];
        let playerWrapper = document.createElement('div');
        playerWrapper.setAttribute('class', 'player-wrapper');
        playerWrapper.style.backgroundImage = `url('${activeChar.image}')`;
        roadBoardRef.current.appendChild(playerWrapper);

        let areaRect = gameAreaRef.current.getBoundingClientRect();
        let laneWidth = areaRect.width / 3;
        playerRef.current.x = (laneWidth * 1.5) - (playerRef.current.width / 2);
        playerWrapper.style.left = playerRef.current.x + "px";

        spawnInitialItems();
    };

    // Build Lanes Background lines
    const createLanes = () => {
        for (let i = 0; i < 6; i++) {
            let lLeft = document.createElement('div');
            lLeft.setAttribute('class', 'lines line-left');
            lLeft.y = (i * 200);
            lLeft.style.top = lLeft.y + "px";
            roadBoardRef.current.appendChild(lLeft);
            itemsRef.current.lines.push(lLeft);

            let lRight = document.createElement('div');
            lRight.setAttribute('class', 'lines line-right');
            lRight.y = (i * 200);
            lRight.style.top = lRight.y + "px";
            roadBoardRef.current.appendChild(lRight);
            itemsRef.current.lines.push(lRight);
        }
    };

    const spawnInitialItems = () => {
        let areaRect = gameAreaRef.current.getBoundingClientRect();
        let laneWidth = areaRect.width / 3;

        for (let i = 0; i < 4; i++) {
            let enemy = document.createElement('div');
            enemy.setAttribute('class', 'enemy');
            setupEnemyProperties(enemy, 1);
            enemy.y = ((i + 1) * -400); 
            enemy.style.top = enemy.y + "px";
            enemy.lane = Math.floor(Math.random() * 3);
            enemy.style.left = (enemy.lane * laneWidth + (laneWidth/2) - 37.5) + "px";
            roadBoardRef.current.appendChild(enemy);
            itemsRef.current.enemies.push(enemy);
        }
    };

    const setupEnemyProperties = (enemy, l) => {
        if (l >= 6) {
            enemy.classList.add('walking');
            enemy.style.backgroundImage = `url('${CONFIG.level6EnemyImages[Math.floor(Math.random() * CONFIG.level6EnemyImages.length)]}')`;
            enemy.innerText = "";
        } else if (l >= 5) {
            enemy.classList.add('walking');
            enemy.style.backgroundImage = `url('${CONFIG.level5EnemyImages[Math.floor(Math.random() * CONFIG.level5EnemyImages.length)]}')`;
            enemy.innerText = "";
        } else if (l >= 4) {
            enemy.classList.add('walking');
            enemy.style.backgroundImage = `url('${CONFIG.level4EnemyImages[Math.floor(Math.random() * CONFIG.level4EnemyImages.length)]}')`;
            enemy.innerText = "";
        } else if (l >= 3) {
            enemy.classList.add('walking');
            enemy.style.backgroundImage = `url('${CONFIG.level3EnemyImages[Math.floor(Math.random() * CONFIG.level3EnemyImages.length)]}')`;
            enemy.innerText = "";
        } else if (l >= 2) {
            enemy.classList.add('walking');
            enemy.style.backgroundImage = `url('${CONFIG.level2EnemyImages[Math.floor(Math.random() * CONFIG.level2EnemyImages.length)]}')`;
            enemy.innerText = "";
        } else {
            enemy.classList.remove('walking');
            enemy.style.backgroundImage = `url('${CONFIG.enemyImages[Math.floor(Math.random() * CONFIG.enemyImages.length)]}')`;
            enemy.innerText = CONFIG.enemyLabels[Math.floor(Math.random() * CONFIG.enemyLabels.length)];
        }
    };

    // Game loop ticks lifecycle hook
    useEffect(() => {
        let lastTime = 0;
        let frameId = null;

        const loop = (time) => {
            if (gameState !== 'PLAYING') {
                lastTime = 0;
                return;
            }
            if (!lastTime) lastTime = time;
            let dt = time - lastTime;
            lastTime = time;

            if (dt > 100) dt = 16.7;

            // Loop updates
            updatePhysics(dt);

            frameId = requestAnimationFrame(loop);
        };

        if (gameState === 'PLAYING') {
            frameId = requestAnimationFrame(loop);
        }

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [gameState]);

    // Update coordinates, slide animations, powerup timers
    const updatePhysics = (dt) => {
        let playerElem = roadBoardRef.current.querySelector('.player-wrapper');
        if (!playerElem) return;

        let areaRect = gameAreaRef.current.getBoundingClientRect();
        let laneWidth = areaRect.width / 3;

        // 1. Sideways lane transition slides interpolation
        let targetX = (playerRef.current.currentLane * laneWidth + (laneWidth / 2)) - (playerRef.current.width / 2);
        
        let slideSpeed = 0.18;
        if (selectedChar === 'sigma') slideSpeed = 0.22; // Sigma speed boost

        let dx = targetX - playerRef.current.x;
        playerRef.current.x += dx * slideSpeed;

        if (Math.abs(dx) > 2) {
            playerElem.style.transform = `rotate(${dx > 0 ? 12 : -12}deg)`;
        } else {
            playerElem.style.transform = 'rotate(0deg)';
        }
        playerElem.style.left = playerRef.current.x + "px";

        // Parallax background stars offset
        let parallaxBg = document.getElementById('parallaxBg');
        if (parallaxBg) {
            let shiftX = (playerRef.current.x - (areaRect.width / 2)) * -0.08;
            parallaxBg.style.transform = `translateX(${shiftX}px)`;
        }

        // 2. Power-ups duration decrements
        decrementPowerups(dt, playerElem);

        // 3. Scrolling road markers & grid animations
        scrollRoadBackground();

        // 4. Spawns items randomly
        tickSpawning(areaRect, laneWidth);

        // 5. Physics movements & magnet pulling
        moveLootItems(playerElem, areaRect);
        moveObstacles(playerElem, areaRect, laneWidth);

        // 6. Score increments
        let multiplier = 1;
        if (activePowerupsRef.current.double.active) multiplier *= 2;
        if (activePowerupsRef.current.nitro.active) multiplier *= 3;
        
        if (selectedChar === 'modiji') {
            playerRef.current.score += multiplier * 1.5;
        } else {
            playerRef.current.score += multiplier;
        }

        let displayScore = Math.floor(playerRef.current.score / 10);
        setScore(displayScore);

        // Level Up Checking
        let calculatedLvl = Math.floor(displayScore / 50) + 1;
        if (calculatedLvl > playerRef.current.level) {
            if (calculatedLvl > 6) {
                endGame(true); // Victory
                return;
            }
            playerRef.current.level = calculatedLvl;
            playerRef.current.speed += 0.6;
            setLevel(calculatedLvl);
            playLevelUpSnd();
            triggerLevelUpAnim();
        }
    };

    const triggerLevelUpAnim = () => {
        let levelUpMsg = document.getElementById('levelUpMsg');
        if (!levelUpMsg) return;
        
        let texts = CONFIG.levelUpTexts;
        levelUpMsg.innerText = texts[Math.floor(Math.random() * texts.length)];
        levelUpMsg.classList.remove('hide', 'level-animate');
        void levelUpMsg.offsetWidth; 
        levelUpMsg.classList.add('level-animate');
    };

    const scrollRoadBackground = () => {
        let speed = playerRef.current.speed;
        if (activePowerupsRef.current.nitro.active) speed *= 2.2;

        itemsRef.current.lines.forEach(item => {
            if (item.y >= gameAreaRef.current.clientHeight + 100) item.y -= gameAreaRef.current.clientHeight + 150;
            item.y += speed;
            item.style.top = item.y + "px";
        });
    };

    // Decrement powerup timer clocks
    const decrementPowerups = (dt, playerElem) => {
        let statesChanged = false;
        let activeCopy = { ...powerupsActive };

        for (let key in activePowerupsRef.current) {
            let p = activePowerupsRef.current[key];
            if (p.active) {
                p.timeRemaining -= dt;
                
                // HUD timer bars
                let bar = document.querySelector(`#${key}-hud .powerup-indicator-bar`);
                if (bar) {
                    let percent = Math.max(0, (p.timeRemaining / p.duration) * 100);
                    bar.style.transform = `scaleX(${percent / 100})`;
                }

                if (p.timeRemaining <= 0) {
                    p.active = false;
                    activeCopy[key] = false;
                    statesChanged = true;

                    // Clean DOM elements
                    if (key === 'shield') {
                        let bubble = playerElem.querySelector('.player-shield-bubble');
                        if (bubble) bubble.remove();
                    }
                    if (key === 'nitro') {
                        gameAreaRef.current.classList.remove('shake');
                        let road = document.getElementById('roadBoard');
                        if (road) road.classList.remove('nitro-active-road');
                        let flame = playerElem.querySelector('.player-nitro-fire');
                        if (flame) flame.remove();
                    }
                    if (key === 'magnet') {
                        let ring = playerElem.querySelector('.magnet-ring');
                        if (ring) ring.remove();
                    }
                }
            }
        }

        if (statesChanged) {
            setPowerupsActive(activeCopy);
        }
    };

    // Activate powerup effects
    const triggerPowerupBoost = (type) => {
        playPowerupSnd();
        let p = activePowerupsRef.current[type];
        p.active = true;

        let duration = p.duration;
        if (type === 'shield' && selectedChar === 'gigachad') duration += 4000;
        if (type === 'magnet' && selectedChar === 'rahul') duration += 5000;

        p.timeRemaining = duration;
        p.duration = duration;

        setPowerupsActive(prev => ({ ...prev, [type]: true }));

        let playerElem = roadBoardRef.current.querySelector('.player-wrapper');
        if (!playerElem) return;

        if (type === 'shield' && !playerElem.querySelector('.player-shield-bubble')) {
            let bubble = document.createElement('div');
            bubble.className = 'player-shield-bubble';
            playerElem.appendChild(bubble);
        }
        if (type === 'magnet' && !playerElem.querySelector('.magnet-ring')) {
            let ring = document.createElement('div');
            ring.className = 'magnet-ring';
            playerElem.appendChild(ring);
        }
        if (type === 'nitro') {
            if (!playerElem.querySelector('.player-nitro-fire')) {
                let flame = document.createElement('div');
                flame.className = 'player-nitro-fire';
                playerElem.appendChild(flame);
            }
            gameAreaRef.current.classList.add('shake');
            let road = document.getElementById('roadBoard');
            if (road) road.classList.add('nitro-active-road');
        }
    };

    // Item spawning ticks
    const tickSpawning = (areaRect, laneWidth) => {
        // Spawn Coins sequence (1.5% chance)
        if (Math.random() < 0.015 && itemsRef.current.coins.length < 15) {
            let lane = Math.floor(Math.random() * 3);
            for (let i = 0; i < 3; i++) {
                let coin = document.createElement('div');
                coin.setAttribute('class', 'coin');
                coin.innerText = "A+";
                coin.lane = lane;
                coin.y = -200 - (i * 70);
                coin.x = (lane * laneWidth + (laneWidth/2) - 17.5);
                coin.style.left = coin.x + "px";
                coin.style.top = coin.y + "px";
                roadBoardRef.current.appendChild(coin);
                itemsRef.current.coins.push(coin);
            }
        }

        // Spawn Powerups (0.15% chance)
        if (Math.random() < 0.0015 && itemsRef.current.powerups.length < 2) {
            let types = ['shield', 'magnet', 'nitro', 'double'];
            let chosen = types[Math.floor(Math.random() * types.length)];
            let lane = Math.floor(Math.random() * 3);

            let pup = document.createElement('div');
            pup.setAttribute('class', `powerup-item powerup-${chosen}`);
            pup.type = chosen;

            let emoji = "🛡️";
            if (chosen === 'magnet') emoji = "🧲";
            if (chosen === 'nitro') emoji = "⚡";
            if (chosen === 'double') emoji = "🪙";
            pup.innerHTML = emoji;

            pup.lane = lane;
            pup.y = -150;
            pup.x = (lane * laneWidth + (laneWidth/2) - 20);
            pup.style.left = pup.x + "px";
            pup.style.top = pup.y + "px";
            roadBoardRef.current.appendChild(pup);
            itemsRef.current.powerups.push(pup);
        }
    };

    // Move coins/powerups and magnet calculations
    const moveLootItems = (playerElem, areaRect) => {
        let playerBounds = playerElem.getBoundingClientRect();
        let speed = playerRef.current.speed;
        if (activePowerupsRef.current.nitro.active) speed *= 2.2;

        // Coins movement
        for (let i = itemsRef.current.coins.length - 1; i >= 0; i--) {
            let coin = itemsRef.current.coins[i];
            
            if (activePowerupsRef.current.magnet.active || activePowerupsRef.current.nitro.active) {
                let pCenterX = playerRef.current.x + (playerRef.current.width / 2);
                let pCenterY = gameAreaRef.current.clientHeight - 60 - (playerRef.current.height / 2);
                let cCenterX = coin.x + 17.5;
                let cCenterY = coin.y + 17.5;

                let dx = pCenterX - cCenterX;
                let dy = pCenterY - cCenterY;
                let dist = Math.sqrt(dx*dx + dy*dy);
                let threshold = activePowerupsRef.current.nitro.active ? 400 : 180;

                if (dist < threshold) {
                    coin.x += dx * 0.16;
                    coin.y += dy * 0.16;
                    coin.style.left = coin.x + "px";
                } else {
                    coin.y += speed;
                }
            } else {
                coin.y += speed;
            }

            coin.style.top = coin.y + "px";

            // Collision check
            let coinBounds = coin.getBoundingClientRect();
            if (isCollide(playerBounds, coinBounds)) {
                coin.remove();
                itemsRef.current.coins.splice(i, 1);
                
                let coinValue = 1;
                if (activePowerupsRef.current.double.active) coinValue *= 2;
                
                setCoins(prev => {
                    let updated = prev + coinValue;
                    localStorage.setItem('engi_coins', updated);
                    return updated;
                });
                playCoinSnd();
                continue;
            }

            // Boundary clean
            if (coin.y >= gameAreaRef.current.clientHeight + 100) {
                coin.remove();
                itemsRef.current.coins.splice(i, 1);
            }
        }

        // Power-ups movement
        for (let i = itemsRef.current.powerups.length - 1; i >= 0; i--) {
            let pup = itemsRef.current.powerups[i];
            pup.y += speed;
            pup.style.top = pup.y + "px";

            let pupBounds = pup.getBoundingClientRect();
            if (isCollide(playerBounds, pupBounds)) {
                pup.remove();
                itemsRef.current.powerups.splice(i, 1);
                triggerPowerupBoost(pup.type);
                continue;
            }

            if (pup.y >= gameAreaRef.current.clientHeight + 100) {
                pup.remove();
                itemsRef.current.powerups.splice(i, 1);
            }
        }
    };

    // Move obstacles & collision breakdowns
    const moveObstacles = (playerElem, areaRect, laneWidth) => {
        let playerBounds = playerElem.getBoundingClientRect();
        let speed = playerRef.current.speed;
        if (activePowerupsRef.current.nitro.active) speed *= 2.2;

        itemsRef.current.enemies.forEach(item => {
            // drifting levels checks
            if (playerRef.current.level >= 4) {
                if (!item.driftCooldown) item.driftCooldown = Math.random() * 2000 + 1000;
                item.driftCooldown -= 16.7;
                if (item.driftCooldown <= 0) {
                    let drift = Math.random() < 0.5 ? -1 : 1;
                    let nLane = item.lane + drift;
                    if (nLane >= 0 && nLane <= 2) {
                        item.lane = nLane;
                        item.style.left = (item.lane * laneWidth + (laneWidth/2) - 37.5) + "px";
                    }
                    item.driftCooldown = Math.random() * 2000 + 1500;
                }
            }

            let itemBounds = item.getBoundingClientRect();
            
            // Nitro crash destruction
            if (activePowerupsRef.current.nitro.active && isCollide(playerBounds, itemBounds)) {
                playCrashSnd();
                createCrashExplosion(item.x || parseFloat(item.style.left), item.y);
                resetObstacle(item, areaRect, laneWidth);
                return;
            }

            // Standard collision check
            if (isCollide(playerBounds, itemBounds)) {
                if (activePowerupsRef.current.shield.active) {
                    // Shield breaks
                    activePowerupsRef.current.shield.active = false;
                    setPowerupsActive(prev => ({ ...prev, shield: false }));
                    
                    let bubble = playerElem.querySelector('.player-shield-bubble');
                    if (bubble) bubble.remove();

                    playCrashSnd();
                    createCrashExplosion(item.x || parseFloat(item.style.left), item.y);

                    gameAreaRef.current.classList.add('shake');
                    setTimeout(() => gameAreaRef.current.classList.remove('shake'), 300);

                    resetObstacle(item, areaRect, laneWidth);
                    return;
                } else {
                    endGame(false); // Game Over
                    return;
                }
            }

            // standard move updates
            if (item.y >= gameAreaRef.current.clientHeight + 100) {
                resetObstacle(item, areaRect, laneWidth);
            } else {
                item.y += speed;
                item.style.top = item.y + "px";
            }
        });
    };

    const resetObstacle = (item, areaRect, laneWidth) => {
        playTone(100, 'sine', 0.1, 0.05); // Pass score sfx
        item.y = -400;
        item.lane = Math.floor(Math.random() * 3);
        item.style.left = (item.lane * laneWidth + (laneWidth/2) - 37.5) + "px";
        setupEnemyProperties(item, playerRef.current.level);
        item.style.top = item.y + "px";
    };

    // Bounding collision box checks
    const isCollide = (aRect, bRect) => {
        const px = 12;
        const py = 12;
        return !(
            ((aRect.top + py) > bRect.bottom) ||
            ((aRect.bottom - py) < bRect.top) ||
            ((aRect.right - px) < bRect.left) ||
            ((aRect.left + px) > bRect.right)
        );
    };

    // Explosion effects particles
    const createCrashExplosion = (x, y) => {
        for (let i = 0; i < 8; i++) {
            let p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = '12px';
            p.style.height = '12px';
            p.style.borderRadius = '50%';
            p.style.background = '#ef4444';
            p.style.boxShadow = '0 0 10px #ef4444';
            p.style.left = (x + 35) + 'px';
            p.style.top = (y + 35) + 'px';
            p.style.zIndex = '60';
            roadBoardRef.current.appendChild(p);

            let angle = Math.random() * Math.PI * 2;
            let sp = Math.random() * 5 + 3;
            let vx = Math.cos(angle) * sp;
            let vy = Math.sin(angle) * sp;
            let op = 1;

            const updateParticle = () => {
                let px = parseFloat(p.style.left);
                let py = parseFloat(p.style.top);
                p.style.left = (px + vx) + "px";
                p.style.top = (py + vy) + "px";
                op -= 0.04;
                p.style.opacity = op;

                if (op > 0) requestAnimationFrame(updateParticle);
                else p.remove();
            };
            requestAnimationFrame(updateParticle);
        }
    };

    // End Game Manager
    const endGame = (isWin = false) => {
        setGameState('GAMEOVER');
        
        if (bgMusicRef.current) bgMusicRef.current.pause();

        let playerElem = roadBoardRef.current.querySelector('.player-wrapper');
        if (playerElem) {
            if (isWin) {
                playerElem.style.transform = 'scale(1.5)';
            } else {
                playerElem.style.transform = 'scale(1.5) rotate(70deg)';
                playerElem.style.filter = 'grayscale(0.8) contrast(1.5)';
            }
        }

        // Leaderboard eligibility checks
        let calculatedScore = Math.floor(playerRef.current.score / 10);
        checkHighScoreSaveState(calculatedScore, playerRef.current.level);

        // Videos popup trigger
        let videoLink = "";
        if (isWin || playerRef.current.level >= 6) videoLink = CONFIG.gameOverVideo6;
        else if (playerRef.current.level === 5) videoLink = CONFIG.gameOverVideo5;
        else if (playerRef.current.level === 4) videoLink = CONFIG.gameOverVideo4;
        else if (playerRef.current.level === 3) videoLink = CONFIG.gameOverVideo3;
        else if (playerRef.current.level === 2) videoLink = CONFIG.gameOverVideo2;
        else videoLink = CONFIG.gameOverVideo1;

        if (isWin) {
            playLevelUpSnd();
        } else {
            playCrashSnd();
        }

        setVideoUrl(videoLink);
        setShowVideo(true);
    };

    const checkHighScoreSaveState = (scoreVal, levelVal) => {
        try {
            let isEligible = leaderboard.length < 5 || scoreVal > leaderboard[leaderboard.length - 1].score;
            if (isEligible) {
                setIsHighScoreEligible(true);
            }
        } catch(e) {}
    };

    // Handle high score saves
    const handleSaveScore = () => {
        let name = playerName.trim().substring(0, 12) || "Gamer";
        let date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        
        let board = [ ...leaderboard ];
        board.push({ name, score, level, date });
        board.sort((a, b) => b.score - a.score);
        board = board.slice(0, 5);

        setLeaderboard(board);
        localStorage.setItem('engi_leaderboard', JSON.stringify(board));
        
        setIsHighScoreEligible(false);
        setPlayerName('');
        playTone(800, 'triangle', 0.2, 0.1);
        setShowLeaderboard(true);
    };

    // Handle skins selecting/purchasing
    const handleSelectChar = (char) => {
        let isOwned = ownedChars.includes(char.id);

        if (isOwned) {
            setSelectedChar(char.id);
            localStorage.setItem('engi_selected_char', char.id);
            playTone(600, 'sine', 0.1, 0.1);
        } else {
            if (coins >= char.cost) {
                let updatedCoins = coins - char.cost;
                let updatedOwned = [ ...ownedChars, char.id ];

                setCoins(updatedCoins);
                setOwnedChars(updatedOwned);
                setSelectedChar(char.id);

                localStorage.setItem('engi_coins', updatedCoins);
                localStorage.setItem('engi_owned_chars', JSON.stringify(updatedOwned));
                localStorage.setItem('engi_selected_char', char.id);

                playTone(800, 'triangle', 0.2, 0.1);
                setTimeout(() => playTone(1000, 'triangle', 0.3, 0.1), 100);
            } else {
                playTone(200, 'sawtooth', 0.3, 0.1);
                alert("Not enough A+ coins! Dodge more exams to collect coins.");
            }
        }
    };

    return (
        <div className={`game-panel theme-${level % 5 === 0 ? 5 : level % 5}`} id="gameArea" ref={gameAreaRef}>
            
            {/* Parallax Starry Background */}
            <div className="parallax-bg" id="parallaxBg"></div>
            
            {/* 3D Road Board Floor */}
            <div className="road-board" id="roadBoard" ref={roadBoardRef}></div>

            {/* Left HUD Pill stats */}
            <HUD level={level} score={score} coins={coins} />

            {/* Right HUD Menu Actions */}
            <HudActions 
                onOpenShop={() => setShowShop(true)}
                onOpenLeaderboard={() => setShowLeaderboard(true)}
                onToggleVolume={() => setShowVolume(prev => !prev)}
            />

            {/* Sound controls sliders panel */}
            <VolumePopover 
                show={showVolume}
                musicVolume={musicVolume}
                sfxVolume={sfxVolume}
                onMusicVolumeChange={setMusicVolume}
                onSfxVolumeChange={setSfxVolume}
            />

            {/* Power-up HUD sliders trackers (Bottom-left) */}
            <div className="active-powerups-hud">
                <div id="shield-hud" className={`powerup-indicator shield-active ${powerupsActive.shield ? 'show' : ''}`}>
                    <span>🛡️ Shield</span>
                    <div className="powerup-indicator-progress"><div className="powerup-indicator-bar"></div></div>
                </div>
                <div id="magnet-hud" className={`powerup-indicator magnet-active ${powerupsActive.magnet ? 'show' : ''}`}>
                    <span>🧲 Magnet</span>
                    <div className="powerup-indicator-progress"><div className="powerup-indicator-bar"></div></div>
                </div>
                <div id="nitro-hud" className={`powerup-indicator nitro-active ${powerupsActive.nitro ? 'show' : ''}`}>
                    <span>⚡ Nitro</span>
                    <div className="powerup-indicator-progress"><div className="powerup-indicator-bar"></div></div>
                </div>
                <div id="double-hud" className={`powerup-indicator double-active ${powerupsActive.double ? 'show' : ''}`}>
                    <span>🪙 2x Pts</span>
                    <div className="powerup-indicator-progress"><div className="powerup-indicator-bar"></div></div>
                </div>
            </div>

            {/* HUD Pause trigger (Bottom-right) */}
            {gameState === 'PLAYING' && (
                <div 
                    id="pauseBtn" 
                    className="hud-btn" 
                    style={{ position: 'absolute', top: 'auto', bottom: '20px', right: '20px', borderRadius: '50%' }}
                    onClick={togglePause}
                >
                    ⏸️
                </div>
            )}

            {gameState === 'PAUSED' && (
                <div 
                    id="pauseBtn" 
                    className="hud-btn" 
                    style={{ position: 'absolute', top: 'auto', bottom: '20px', right: '20px', borderRadius: '50%' }}
                    onClick={togglePause}
                >
                    ▶️
                </div>
            )}

            {/* Level Up animations message */}
            <div id="levelUpMsg">STONKS! 📈</div>

            {/* Overlays: Start Screen */}
            {gameState === 'START' && (
                <div id="startScreen" className="screen">
                    <h1 style={{ fontSize: '48px', letterSpacing: '4px' }}>ENGI-RUN</h1>
                    <p>Dodge the annoying exams and memes! Use <b>Left/Right Arrow keys</b> or <b>Swipe Left/Right</b> on mobile to switch lanes.</p>
                    <button id="startBtn" onClick={startGame}>START GAME</button>
                </div>
            )}

            {/* Overlays: Game Over Screen */}
            {gameState === 'GAMEOVER' && (
                <div id="gameOverScreen" className="screen">
                    <h1 id="gameOverTitle" style={{ fontSize: '44px' }}>WASTED!</h1>
                    <p style={{ marginBottom: '15px' }}>
                        You got caught.<br/><br/>
                        LEVEL REACHED: <span id="finalLevel" style={{ color: '#fbbf24', fontWeight: 900 }}>{level}</span><br/>
                        FINAL SCORE: <span id="finalScore" style={{ color: '#38bdf8', fontWeight: 900 }}>{score}</span>
                    </p>

                    {/* Inline score save panel */}
                    {isHighScoreEligible && (
                        <div id="highScoreSaveArea" style={{ margin: '10px 0 25px 0', display: 'flex', flexDirection: 'column', gap: '8px', width: '85%', maxWidth: '280px', background: 'rgba(255,255,255,0.06)', padding: '15px', borderRadius: '16px', border: '1.5px dashed var(--neon-gold)' }}>
                            <h3 style={{ color: 'var(--neon-gold)', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 5px rgba(251,191,36,0.4)' }}>
                                🏆 New High Score!
                            </h3>
                            <input 
                                type="text" 
                                id="playerNameInput" 
                                placeholder="Enter your name" 
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '20px', border: '1.5px solid var(--neon-blue)', background: 'rgba(0,0,0,0.6)', color: 'white', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', outline: 'none', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)' }}
                            />
                            <button onClick={handleSaveScore} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 'bold', width: '100%', borderRadius: '20px' }}>
                                Save Score
                            </button>
                        </div>
                    )}
                    
                    <button id="restartBtn" onClick={startGame}>Play Again</button>
                </div>
            )}

            {/* Overlays: Skins selection shop */}
            <SkinsShopModal 
                show={showShop}
                onClose={() => setShowShop(false)}
                characters={CONFIG.characters}
                coins={coins}
                ownedChars={ownedChars}
                selectedChar={selectedChar}
                onSelectChar={handleSelectChar}
            />

            {/* Overlays: Leaderboards modal */}
            <LeaderboardModal 
                show={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                leaderboard={leaderboard}
            />

            {/* Troll meme video pops */}
            <MemeVideoPopup 
                show={showVideo}
                videoUrl={videoUrl}
                onClose={() => {
                    setShowVideo(false);
                    setVideoUrl('');
                }}
            />

            {/* Background audio loop node */}
            <audio ref={bgMusicRef} loop />
        </div>
    );
}
