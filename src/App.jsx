import React, { useState, useEffect, useRef, useCallback } from 'react';

// Google Fonts - add to head or import in CSS
const FONTS = [
  "'JetBrains Mono', monospace",
  "'Space Mono', monospace", 
  "'Source Code Pro', monospace",
];

const TITLE_TEXT = 'bren.id.au';
const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Star colors - realistic distribution
const STAR_COLORS = [
  { color: '#ffffff', weight: 50 },  // White
  { color: '#cad8ff', weight: 25 },  // Blue-white
  { color: '#aabfff', weight: 10 },  // Light blue
  { color: '#ffe4c4', weight: 10 },  // Warm yellow
  { color: '#ffccaa', weight: 4 },   // Orange
  { color: '#ffaaaa', weight: 1 },   // Red giant
];

const getRandomStarColor = () => {
  const totalWeight = STAR_COLORS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const star of STAR_COLORS) {
    random -= star.weight;
    if (random <= 0) return star.color;
  }
  return STAR_COLORS[0].color;
};

const COLORS = {
  bg: '#0a0a0f',
  accent: '#58a6ff',
  outline: '#58a6ff',
};

const PACKET_COLORS = [
  { color: '#58a6ff', weight: 40 },  // Electric Blue
  { color: '#22d3ee', weight: 25 },  // Cyan
  { color: '#a78bfa', weight: 20 },  // Purple
  { color: '#34d399', weight: 10 },  // Mint
  { color: '#fbbf24', weight: 5 },   // Amber
];

const TRAIL_TYPES = [
  { type: 'comet', weight: 40 },     // Fading opacity tail
  { type: 'dots', weight: 35 },      // Trailing smaller circles
  { type: 'blur', weight: 25 },      // Motion blur stretch
];

const COLOR_DRIFTS = {
  '#58a6ff': '#22d3ee',  // Blue → Cyan
  '#22d3ee': '#34d399',  // Cyan → Mint
  '#a78bfa': '#f472b6',  // Purple → Pink
  '#34d399': '#22d3ee',  // Mint → Cyan
  '#fbbf24': '#fb923c',  // Amber → Orange
};

const CITIES = {
  perth:     { x: 62,  y: 412, label: 'Perth' },
  darwin:    { x: 295, y: 29,  label: 'Darwin' },
  adelaide:  { x: 420, y: 451, label: 'Adelaide' },
  brisbane:  { x: 666, y: 280, label: 'Brisbane' },
  sydney:    { x: 626, y: 441, label: 'Sydney' },
  melbourne: { x: 515, y: 520, label: 'Melbourne', isHub: true },
  hobart:    { x: 544, y: 616, label: 'Hobart' },
};

// Network connections - Melbourne is hub
const CONNECTIONS = [
  // Melbourne hub spokes
  ['melbourne', 'sydney'],
  ['melbourne', 'brisbane'],
  ['melbourne', 'adelaide'],
  ['melbourne', 'perth'],
  ['melbourne', 'darwin'],
  ['melbourne', 'hobart'],
  // Cross-connections
  ['sydney', 'brisbane'],
  ['sydney', 'adelaide'],
  ['adelaide', 'perth'],
  ['perth', 'darwin'],
  ['darwin', 'brisbane'],
];

const getRandomPacketColor = () => {
  const totalWeight = PACKET_COLORS.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const packet of PACKET_COLORS) {
    random -= packet.weight;
    if (random <= 0) return packet.color;
  }
  return PACKET_COLORS[0].color;
};

// Interpolate between two hex colors
const lerpColor = (colorA, colorB, t) => {
  const parseHex = (hex) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
};

const getRandomTrailType = () => {
  const totalWeight = TRAIL_TYPES.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;
  for (const trail of TRAIL_TYPES) {
    random -= trail.weight;
    if (random <= 0) return trail.type;
  }
  return TRAIL_TYPES[0].type;
};

const cubicEaseOut = (t) => 1 - Math.pow(1 - t, 3);

const AustraliaNetwork = () => {
  const [packets, setPackets] = useState([]);
  const [nodePulses, setNodePulses] = useState({});
  const [sparkles, setSparkles] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [ambientParticles, setAmbientParticles] = useState([]);
  const [orbitElectrons, setOrbitElectrons] = useState([]);
  const [breathePhase, setBreathePhase] = useState(0);
  
  // Title animation state
  const [titleChars, setTitleChars] = useState([]);
  const [titleFont, setTitleFont] = useState(FONTS[0]);
  const [titleBursts, setTitleBursts] = useState([]);
  const [showCursor, setShowCursor] = useState(false);
  const [bootPrefix, setBootPrefix] = useState('');
  const titleAnimationRef = useRef(null);
  const titleBurstIdRef = useRef(0);
  
  // Space background state
  const [stars, setStars] = useState([]);
  const [nebulas, setNebulas] = useState([]);
  const [shootingStars, setShootingStars] = useState([]);
  const [galaxies, setGalaxies] = useState([]);
  const shootingStarIdRef = useRef(0);
  
  const animationRef = useRef();
  const lastSpawnRef = useRef(0);
  const nextSpawnDelayRef = useRef(1500);
  const packetIdRef = useRef(0);
  const sparkleIdRef = useRef(0);
  const burstIdRef = useRef(0);

  // Initialize ambient particles and orbit electrons on mount
  useEffect(() => {
    // Create layered star field
    const newStars = [];
    
    // Layer 1: Distant small stars (most numerous, dimmest)
    for (let i = 0; i < 50; i++) {
      newStars.push({
        id: `star-far-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.5 + Math.random() * 0.5,
        baseOpacity: 0.2 + Math.random() * 0.3,
        color: getRandomStarColor(),
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: 'far',
      });
    }
    
    // Layer 2: Mid-distance stars
    for (let i = 0; i < 25; i++) {
      newStars.push({
        id: `star-mid-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 1,
        baseOpacity: 0.4 + Math.random() * 0.3,
        color: getRandomStarColor(),
        twinkleSpeed: 0.3 + Math.random() * 1,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: 'mid',
      });
    }
    
    // Layer 3: Close bright stars (fewer, brighter)
    for (let i = 0; i < 10; i++) {
      newStars.push({
        id: `star-close-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 1.5,
        baseOpacity: 0.6 + Math.random() * 0.4,
        color: getRandomStarColor(),
        twinkleSpeed: 0.2 + Math.random() * 0.8,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: 'close',
      });
    }
    
    setStars(newStars);
    
    // Create nebula patches - subtle cosmic clouds
    const newNebulas = [
      {
        id: 'nebula-1',
        x: 10,
        y: 20,
        width: 35,
        height: 25,
        color: 'rgba(88, 166, 255, 0.03)',
        rotation: 15,
      },
      {
        id: 'nebula-2',
        x: 60,
        y: 55,
        width: 40,
        height: 30,
        color: 'rgba(138, 43, 226, 0.025)',
        rotation: -20,
      },
      {
        id: 'nebula-3',
        x: 35,
        y: 70,
        width: 30,
        height: 20,
        color: 'rgba(34, 211, 238, 0.02)',
        rotation: 5,
      },
    ];
    setNebulas(newNebulas);
    
    // Create distant galaxies
    const newGalaxies = [];
    for (let i = 0; i < 5; i++) {
      newGalaxies.push({
        id: `galaxy-${i}`,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        width: 3 + Math.random() * 4,
        height: 1 + Math.random() * 2,
        rotation: Math.random() * 180,
        opacity: 0.1 + Math.random() * 0.15,
      });
    }
    setGalaxies(newGalaxies);

    // Create ambient background particles (space dust)
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: i,
        x: Math.random() * 775 - 50,
        y: Math.random() * 830 - 150,
        size: 0.3 + Math.random() * 1,
        opacity: 0.05 + Math.random() * 0.1,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
      });
    }
    setAmbientParticles(particles);

    // Create orbit electrons for Melbourne hub
    const electrons = [];
    for (let i = 0; i < 3; i++) {
      electrons.push({
        id: i,
        angle: (i * Math.PI * 2) / 3 + Math.random() * 0.5,
        radius: 25 + Math.random() * 15,
        speed: 0.008 + Math.random() * 0.006,
        color: getRandomPacketColor(),
        targetColor: getRandomPacketColor(),
        colorProgress: 0,
        colorSpeed: 0.005 + Math.random() * 0.01, // How fast to transition
        trailType: getRandomTrailType(),
        size: 2 + Math.random() * 1.5,
        orbitTilt: 0.3 + Math.random() * 0.3,
        orbitRotation: (i * Math.PI / 3) + (Math.random() - 0.5) * 0.5,
      });
    }
    setOrbitElectrons(electrons);
    
    // Shooting star spawner
    const spawnShootingStar = () => {
      const id = shootingStarIdRef.current++;
      const startX = Math.random() * 120 - 10;
      const startY = Math.random() * 40 - 10;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5; // Roughly diagonal
      const length = 15 + Math.random() * 25;
      const duration = 600 + Math.random() * 400;
      
      setShootingStars(prev => [...prev, {
        id,
        startX,
        startY,
        angle,
        length,
        duration,
        startTime: Date.now(),
        color: Math.random() > 0.8 ? '#22d3ee' : '#ffffff',
      }]);
      
      // Clean up after animation
      setTimeout(() => {
        setShootingStars(prev => prev.filter(s => s.id !== id));
      }, duration + 100);
    };
    
    // Recursive shooting star scheduler with variable delays
    let shootingStarTimeout;
    const scheduleNextShootingStar = () => {
      const delay = 8000 + Math.random() * 7000; // 8-15 seconds
      shootingStarTimeout = setTimeout(() => {
        spawnShootingStar();
        scheduleNextShootingStar();
      }, delay);
    };
    
    // Initial shooting star after a short delay
    const initialTimeout = setTimeout(() => {
      spawnShootingStar();
      scheduleNextShootingStar();
    }, 2000 + Math.random() * 3000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(shootingStarTimeout);
    };
  }, []);

  // Title animation functions
  const getRandomChar = () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  
  const matrixDecode = useCallback(() => {
    // Pre-calculate when each character should lock (guarantees completion)
    const lockAt = TITLE_TEXT.split('').map((char, i) => 
      Math.floor(i * 1.5 + Math.random() * 4)
    );
    
    const chars = TITLE_TEXT.split('').map((char, i) => ({
      char: getRandomChar(),
      target: char,
      locked: false,
      lockAt: lockAt[i],
      color: COLORS.accent,
    }));
    setTitleChars(chars);
    setShowCursor(false);
    setBootPrefix('');
    
    const state = { iteration: 0 };
    const maxIterations = Math.max(...lockAt) + 3; // Ensure we go past all lock points
    
    const decode = () => {
      setTitleChars(prev => prev.map((c) => {
        if (c.locked) return c;
        if (state.iteration >= c.lockAt) {
          return { ...c, char: c.target, locked: true };
        }
        return { ...c, char: getRandomChar() };
      }));
      
      state.iteration++;
      if (state.iteration < maxIterations) {
        titleAnimationRef.current = setTimeout(decode, 60);
      } else {
        // Final safety: ensure all chars show correct text
        setTitleChars(TITLE_TEXT.split('').map(char => ({
          char,
          target: char,
          locked: true,
          color: COLORS.accent,
        })));
      }
    };
    
    titleAnimationRef.current = setTimeout(decode, 100);
  }, []);

  const glitchScramble = useCallback(() => {
    // Start with correct text
    setTitleChars(TITLE_TEXT.split('').map(char => ({
      char,
      target: char,
      locked: true,
      color: COLORS.accent,
    })));
    setShowCursor(false);
    setBootPrefix('');
    
    const state = { glitchCount: 0, resetTimeout: null };
    const maxGlitches = 8;
    
    const glitch = () => {
      // Clear any pending reset
      if (state.resetTimeout) clearTimeout(state.resetTimeout);
      
      // Random glitch effect
      const glitchIndices = [];
      const numGlitches = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numGlitches; i++) {
        glitchIndices.push(Math.floor(Math.random() * TITLE_TEXT.length));
      }
      
      setTitleChars(TITLE_TEXT.split('').map((char, i) => {
        if (glitchIndices.includes(i)) {
          return { 
            char: getRandomChar(),
            target: char,
            locked: true,
            color: Math.random() > 0.5 ? '#a78bfa' : '#22d3ee', // Purple or cyan
          };
        }
        return { char, target: char, locked: true, color: COLORS.accent };
      }));
      
      // Reset after brief flash - always use TITLE_TEXT directly
      state.resetTimeout = setTimeout(() => {
        setTitleChars(TITLE_TEXT.split('').map(char => ({
          char,
          target: char,
          locked: true,
          color: COLORS.accent,
        })));
      }, 80);
      
      state.glitchCount++;
      if (state.glitchCount < maxGlitches) {
        titleAnimationRef.current = setTimeout(glitch, 200 + Math.random() * 400);
      } else {
        // Final reset to ensure correct text
        setTimeout(() => {
          setTitleChars(TITLE_TEXT.split('').map(char => ({
            char,
            target: char,
            locked: true,
            color: COLORS.accent,
          })));
        }, 100);
      }
    };
    
    titleAnimationRef.current = setTimeout(glitch, 300);
  }, []);

  const packetArrival = useCallback(() => {
    setTitleChars([]);
    setShowCursor(false);
    setBootPrefix('');
    setTitleBursts([]);
    
    const state = { charIndex: 0 };
    
    const addChar = () => {
      if (state.charIndex >= TITLE_TEXT.length) return;
      
      const currentChar = TITLE_TEXT[state.charIndex];
      const currentIndex = state.charIndex;
      const burstId = titleBurstIdRef.current++;
      
      setTitleChars(prev => [...prev, {
        char: currentChar,
        target: currentChar,
        locked: true,
        color: COLORS.accent,
        burst: true,
      }]);
      
      // Add burst effect
      setTitleBursts(prev => [...prev, { id: burstId, index: currentIndex, life: 1 }]);
      
      // Fade burst
      const fadeBurst = () => {
        setTitleBursts(prev => prev.map(b => 
          b.id === burstId ? { ...b, life: b.life - 0.1 } : b
        ).filter(b => b.life > 0));
      };
      const burstInterval = setInterval(fadeBurst, 30);
      setTimeout(() => clearInterval(burstInterval), 300);
      
      state.charIndex++;
      if (state.charIndex < TITLE_TEXT.length) {
        titleAnimationRef.current = setTimeout(addChar, 80 + Math.random() * 60);
      }
    };
    
    titleAnimationRef.current = setTimeout(addChar, 200);
  }, []);

  const bootSequence = useCallback(() => {
    // Clear any pending animation
    if (titleAnimationRef.current) {
      clearTimeout(titleAnimationRef.current);
    }
    
    // Reset to clean state
    setTitleChars(TITLE_TEXT.split('').map(char => ({
      char: '',
      target: char,
      locked: true,
      color: COLORS.accent,
    })));
    setBootPrefix('');
    setShowCursor(true);
    
    // Create a cancellation token for this animation instance
    const animationId = Date.now();
    titleAnimationRef.animationId = animationId;
    
    // Type the prompt first
    setTimeout(() => {
      if (titleAnimationRef.animationId !== animationId) return;
      setBootPrefix('>');
    }, 200);
    setTimeout(() => {
      if (titleAnimationRef.animationId !== animationId) return;
      setBootPrefix('> ');
    }, 400);
    
    const state = { charIndex: 0 };
    
    const typeChar = () => {
      // Check if this animation was cancelled
      if (titleAnimationRef.animationId !== animationId) return;
      
      if (state.charIndex >= TITLE_TEXT.length) {
        return;
      }
      
      const idx = state.charIndex;
      setTitleChars(prev => prev.map((c, i) => 
        i === idx ? { ...c, char: c.target } : c
      ));
      
      state.charIndex++;
      titleAnimationRef.current = setTimeout(typeChar, 60 + Math.random() * 80);
    };
    
    titleAnimationRef.current = setTimeout(typeChar, 600);
  }, []);

  // Cycle through animations
  useEffect(() => {
    const animations = [matrixDecode, glitchScramble, packetArrival, bootSequence];
    let cycleTimeout;
    
    const runAnimation = () => {
      // Invalidate any running animation
      titleAnimationRef.animationId = null;
      if (titleAnimationRef.current) {
        clearTimeout(titleAnimationRef.current);
      }
      
      // Pick random font
      setTitleFont(FONTS[Math.floor(Math.random() * FONTS.length)]);
      // Run random animation
      const currentIndex = Math.floor(Math.random() * animations.length);
      animations[currentIndex]();
      
      // Schedule next animation with pause
      // Wait 10-15 seconds, giving time for animation to complete + deliberate pause
      cycleTimeout = setTimeout(() => {
        runAnimation();
      }, 10000 + Math.random() * 5000);
    };
    
    // Initial run after short delay
    cycleTimeout = setTimeout(runAnimation, 500);
    
    return () => {
      clearTimeout(cycleTimeout);
      titleAnimationRef.animationId = null;
      if (titleAnimationRef.current) {
        clearTimeout(titleAnimationRef.current);
      }
    };
  }, [matrixDecode, glitchScramble, packetArrival, bootSequence]);

  const getRandomConnection = useCallback(() => {
    return CONNECTIONS[Math.floor(Math.random() * CONNECTIONS.length)];
  }, []);

  const getConnectedCities = useCallback((cityId) => {
    const connected = [];
    for (const [a, b] of CONNECTIONS) {
      if (a === cityId) connected.push(b);
      if (b === cityId) connected.push(a);
    }
    return connected;
  }, []);

  const triggerNodePulse = useCallback((cityId) => {
    setNodePulses(prev => ({ ...prev, [cityId]: Date.now() }));
    setTimeout(() => {
      setNodePulses(prev => {
        const next = { ...prev };
        delete next[cityId];
        return next;
      });
    }, 200);
  }, []);

  const spawnBurst = useCallback((cityId) => {
    const city = CITIES[cityId];
    setBursts(prev => [...prev, {
      id: burstIdRef.current++,
      x: city.x,
      y: city.y,
      life: 1,
      color: COLORS.accent,
    }]);
  }, []);

  const spawnPacket = useCallback((fromCity = null, toCity = null) => {
    setPackets(prev => {
      if (prev.length >= 3) return prev;
      
      let from, to;
      if (fromCity && toCity) {
        from = fromCity;
        to = toCity;
      } else {
        const conn = getRandomConnection();
        const reverse = Math.random() > 0.5;
        from = reverse ? conn[1] : conn[0];
        to = reverse ? conn[0] : conn[1];
      }

      triggerNodePulse(from);
      
      const baseColor = getRandomPacketColor();

      return [...prev, {
        id: packetIdRef.current++,
        from,
        to,
        startTime: performance.now(),
        duration: 800 + Math.random() * 400,
        color: baseColor,
        trailType: getRandomTrailType(),
        glowIntensity: 0.6 + Math.random() * 0.8,  // 0.6 to 1.4
        colorDrift: Math.random() > 0.5,  // 50% chance of color drift
        driftColor: COLOR_DRIFTS[baseColor] || baseColor,
        lastSparkle: 0,
      }];
    });
  }, [getRandomConnection, triggerNodePulse]);

  const animate = useCallback((timestamp) => {
    // Check if we should spawn a new packet
    if (timestamp - lastSpawnRef.current > nextSpawnDelayRef.current) {
      spawnPacket();
      lastSpawnRef.current = timestamp;
      nextSpawnDelayRef.current = 1500 + Math.random() * 3000;
    }

    // Update breathe phase for idle node animation
    setBreathePhase(timestamp * 0.002);

    // Update ambient particles
    setAmbientParticles(prev => prev.map(p => {
      let newX = p.x + p.speedX;
      let newY = p.y + p.speedY;
      // Wrap around edges
      if (newX < -50) newX = 725;
      if (newX > 725) newX = -50;
      if (newY < -150) newY = 680;
      if (newY > 680) newY = -150;
      return { ...p, x: newX, y: newY };
    }));

    // Update orbit electrons
    setOrbitElectrons(prev => prev.map(e => {
      let newProgress = e.colorProgress + e.colorSpeed;
      let newColor = e.color;
      let newTargetColor = e.targetColor;
      
      // When transition completes, pick a new target
      if (newProgress >= 1) {
        newColor = e.targetColor;
        newTargetColor = getRandomPacketColor();
        newProgress = 0;
      }
      
      return {
        ...e,
        angle: e.angle + e.speed,
        color: newColor,
        targetColor: newTargetColor,
        colorProgress: newProgress,
      };
    }));

    // Update bursts - expand and fade
    setBursts(prev => prev
      .map(b => ({ ...b, life: b.life - 0.04 }))
      .filter(b => b.life > 0)
    );

    // Update sparkles - fade them out
    setSparkles(prev => prev
      .map(s => ({ ...s, life: s.life - 0.05 }))
      .filter(s => s.life > 0)
    );

    // Update packets
    setPackets(prev => {
      const stillActive = [];
      const arrivals = [];
      const newSparkles = [];

      for (const packet of prev) {
        const elapsed = timestamp - packet.startTime;
        const progress = Math.min(elapsed / packet.duration, 1);

        if (progress >= 1) {
          arrivals.push(packet);
        } else {
          // Spawn sparkles occasionally
          if (progress > 0.1 && progress < 0.9 && Math.random() < 0.15) {
            const from = CITIES[packet.from];
            const to = CITIES[packet.to];
            const t = cubicEaseOut(progress);
            const x = from.x + (to.x - from.x) * t;
            const y = from.y + (to.y - from.y) * t;
            
            newSparkles.push({
              id: sparkleIdRef.current++,
              x: x + (Math.random() - 0.5) * 8,
              y: y + (Math.random() - 0.5) * 8,
              color: packet.color,
              life: 1,
              size: 1 + Math.random() * 1.5,
            });
          }
          
          stillActive.push({ ...packet, progress });
        }
      }

      // Add new sparkles
      if (newSparkles.length > 0) {
        setSparkles(prev => [...prev, ...newSparkles].slice(-20)); // Cap at 20 sparkles
      }

      // Handle arrivals - trigger pulses, bursts, and maybe chain
      for (const packet of arrivals) {
        triggerNodePulse(packet.to);
        spawnBurst(packet.to);
        
        // 40% chain probability
        if (Math.random() < 0.4 && stillActive.length < 3) {
          const nextHops = getConnectedCities(packet.to).filter(c => c !== packet.from);
          if (nextHops.length > 0) {
            const nextDest = nextHops[Math.floor(Math.random() * nextHops.length)];
            // Schedule chain spawn slightly delayed
            setTimeout(() => spawnPacket(packet.to, nextDest), 50);
          }
        }
      }

      return stillActive;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [spawnPacket, triggerNodePulse, spawnBurst, getConnectedCities]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  const getPacketPosition = (packet) => {
    const from = CITIES[packet.from];
    const to = CITIES[packet.to];
    const progress = packet.progress || 0;
    const t = cubicEaseOut(progress);
    
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    
    // Calculate angle for directional effects
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    // Calculate current color (with optional drift)
    let currentColor = packet.color;
    if (packet.colorDrift) {
      // Interpolate color based on progress
      currentColor = progress < 0.5 ? packet.color : packet.driftColor;
    }
    
    // Calculate pulse size (sine wave + spawn/arrive scaling)
    const pulsePhase = progress * Math.PI * 4; // 2 full pulses during travel
    const basePulse = 1 + Math.sin(pulsePhase) * 0.15; // ±15% size oscillation
    const spawnScale = Math.min(progress * 5, 1); // Quick grow at start
    const arriveScale = progress > 0.85 ? 1 - (progress - 0.85) * 3 : 1; // Shrink at end
    const size = 4 * basePulse * spawnScale * arriveScale;
    
    return { x, y, angle, currentColor, size, progress };
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse at 50% 50%, #0d0d14 0%, #070709 50%, #030304 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 3vw, 2rem)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Space background layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
      }}>
        {/* Nebula patches - subtle background */}
        {nebulas.map(nebula => (
          <div
            key={nebula.id}
            style={{
              position: 'absolute',
              left: `${nebula.x}%`,
              top: `${nebula.y}%`,
              width: `${nebula.width}%`,
              height: `${nebula.height}%`,
              background: `radial-gradient(ellipse at center, ${nebula.color} 0%, transparent 70%)`,
              transform: `rotate(${nebula.rotation}deg)`,
              filter: 'blur(40px)',
            }}
          />
        ))}
        
        {/* Distant galaxies */}
        {galaxies.map(galaxy => (
          <div
            key={galaxy.id}
            style={{
              position: 'absolute',
              left: `${galaxy.x}%`,
              top: `${galaxy.y}%`,
              width: `${galaxy.width}px`,
              height: `${galaxy.height}px`,
              background: 'radial-gradient(ellipse at center, rgba(200, 200, 255, 0.6) 0%, rgba(150, 150, 200, 0.3) 40%, transparent 70%)',
              transform: `rotate(${galaxy.rotation}deg)`,
              filter: 'blur(1px)',
              opacity: galaxy.opacity,
              borderRadius: '50%',
            }}
          />
        ))}
        
        {/* Star field with parallax drift */}
        {stars.map(star => {
          const twinkle = Math.sin(breathePhase * star.twinkleSpeed + star.twinkleOffset);
          const opacity = star.baseOpacity + twinkle * 0.2 * star.baseOpacity;
          
          // Slow automatic drift - different speeds per layer for parallax
          const driftSpeed = star.layer === 'close' ? 0.015 : star.layer === 'mid' ? 0.008 : 0.003;
          const driftX = Math.sin(breathePhase * driftSpeed + star.twinkleOffset) * 3;
          const driftY = Math.cos(breathePhase * driftSpeed * 0.7 + star.twinkleOffset) * 2;
          
          return (
            <div
              key={star.id}
              style={{
                position: 'absolute',
                left: `calc(${star.x}% + ${driftX}px)`,
                top: `calc(${star.y}% + ${driftY}px)`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                borderRadius: '50%',
                opacity: Math.max(0.1, opacity),
                boxShadow: star.layer === 'close' ? `0 0 ${star.size * 2}px ${star.color}` : 'none',
              }}
            />
          );
        })}
        
        {/* Shooting stars */}
        {shootingStars.map(star => {
          const elapsed = Date.now() - star.startTime;
          const progress = Math.min(elapsed / star.duration, 1);
          
          // Animate position along the trajectory
          const travelDistance = star.length * 4;
          const currentTravel = progress * travelDistance;
          
          const x = star.startX + Math.cos(star.angle) * currentTravel;
          const y = star.startY + Math.sin(star.angle) * currentTravel;
          
          // Fade in quickly, fade out slowly
          const opacity = progress < 0.2 
            ? progress * 5 * 0.8 
            : (1 - progress) * 0.8;
          
          return (
            <div
              key={star.id}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${star.length}px`,
                height: '2px',
                background: `linear-gradient(to left, ${star.color}, transparent)`,
                transform: `rotate(${star.angle * (180 / Math.PI)}deg)`,
                opacity: Math.max(0, opacity),
                filter: 'blur(0.5px)',
                transformOrigin: 'right center',
              }}
            />
          );
        })}
        
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
      <svg
        viewBox="-50 -150 775 830"
        style={{
          width: '100%',
          maxWidth: '800px',
          height: 'auto',
          minHeight: '300px',
          maxHeight: '70vh',
          position: 'relative',
          zIndex: 1,
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter for nodes */}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Packet glow filters - varying intensities */}
          <filter id="packetGlowSoft" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="packetGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="packetGlowIntense" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse animation filter */}
          <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Sparkle glow */}
          <filter id="sparkleGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Burst ring glow */}
          <filter id="burstGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Ambient particle glow */}
          <filter id="ambientGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient background particles */}
        {ambientParticles.map(p => (
          <circle
            key={`ambient-${p.id}`}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill="#8899bb"
            opacity={p.opacity}
            filter="url(#ambientGlow)"
          />
        ))}

        {/* Australia outline - mainland */}
        <path
          d="m708.4 502.01c0 37.16-11.92 65.02-27.17 90.8-3.57 6.03-8.05 7.41-12.34 12.89-9.93 12.7-5.87 26.34-19.51 36.53-11.91 8.9-14.48 24.4-14.96 40.51-0.23 7.49-16.51-1.37-21.05 3.27-2.6 2.65-11.77-1.05-15.39 0.98-7.92 4.44-14.63 14.82-23.89 19.37-7.4 3.64-12.6-16.52-21.87-15.24-15.76 2.18-33.59-4.74-52.76-3.26-8.96 0.69-12.09-18.46-21.25-17.17-12.83 1.81 0.4-46.57-11.35-37.37-12.99 10.17-7.22-22.08-19.92-22.08-5.47 0 7.66-30.14 2.17-30.19-2.36-0.02-32.59 33.65-33.93 31.7-4.21-6.11-7.87-20.52-15.34-26.81-5.25-4.43-7.9-11.28-13.4-15.09-8.99-6.23-16.11-2.36-25.66-7.12-5.77-2.87-11.54-7.1-17.37-6.82-8.84 0.42-14.53 2.38-27.09 3.39-20.5 1.66-34.66 14.44-55.05 14.11-17.02-0.28-31.21 35.1-47.69 32.77-18.03-2.55-32.34 4.29-45.13 4.12-11.01-0.14-20.45 29.56-30.42 25.02-14.24-6.49-36.13 2.41-47.822-13.43-5.486-7.44 12.562-6.29 8.105-15.84-2.685-5.75 0.519-12.17 0.268-19.57-0.192-5.68-3.656-12.27-5.863-17.55-2.267-5.42-7.544-9.92-10.006-16.38-1.976-5.18-0.969-12.2-3.938-17.57-4.309-7.8-11.825-15.42-16.082-22.92-2.189-3.86-1.425-8.14-3.718-11.67-6.669-10.26-17.693-14.85-21.19-23.52-2.934-7.27 20.25 5.54 21.256 0.17 0.721-3.84-6.174-8.59-10.094-16.02-4.882-9.25-7.114-21.28-7.114-25.05 0-9.54-2.331-27.06 0.883-34.25 3.198-7.15 8.255-2.79 14.227-7.64 9.028-7.33 17.724-16.67 30.774-23.07 4.513-2.21 11.229-1.81 16.214-3.81 19.33-7.77 39.47-16.91 57.97-26.47 8.73-4.52 11.2-20.1 19.53-25.23 3.65-2.25-6.66-13.07-3.05-15.43 5.29-3.45 1.29-10.87 6.56-14.56 4.16-2.91 15.25 14.97 19.34 11.85 2.64-2.02-4.04-19.61-1.45-21.77 3.35-2.8 15.21 7.51 18.56 4.62 2.61-2.26-7.96-18.51-5.38-20.86 13.61-12.45 31.83-22.7 47.09-34.28 4.46-3.39 19.79 21.93 24.32 18.69 7.28-5.22 18.8 10.12 25.57 3.38 5.6-5.58-11.58-7.92-6.34-15.39 6.96-9.89 12.74-23.67 24.48-33.89 7.92-6.9 20.45 1.94 29.93-2.47 3.02-1.4 4.15-6.15-0.11-9.64-4.05-3.31-13.5-5.34-11.15-7.84 3.29-3.51 22.32 6.61 33.45 6 5.58-0.31 11.7 4.26 13.25 4.26 5.2 0 11.92 5.49 17.06 5.64 3.63 0.1 5.11-5.18 8.7-5.01 7.95 0.38 11.26 2.97 19.04 3.71 7.4 0.69 4.02 10.28-0.88 15.7-2.52 2.79-16.91 7.68-12.68 13.14 4.31 5.55-14.81 19.29-8.17 23.4 25.99 16.08 49.08 45.95 79.91 53.95 24.99 6.49 26.96-48.57 29.67-73.46 1.71-15.72 17.78-64.12 21.46-53.82 3.84 10.76 7.9 26.5 17.87 47.51 1.72 3.63-0.1 16.99 2.24 20.9 2.39 4 7.19 0.39 11.75 2.08 4.26 1.59 8.24 8.45 11.51 12.52 5.2 6.46-1.54 28.67 4.42 35.58 8.16 9.47 4.05 39.01 13.49 48.28 3.76 3.69 8.43-2.83 12.43 0.6 5.72 4.9 17.56 12.78 21.35 19.42 2.76 4.85-2.74 8.67 1.64 11.97 7.32 5.5 9.42 27.64 16.84 32.44 3.04 1.96 0.69-6.33 8.41-0.84 5.68 4.04 3.43 15.89 7.3 21.06 5.85 7.8 19.16 23.36 23.89 30.4 10.61 15.8 4.65 39.4 4.65 47.67z"
          transform="translate(-36.443, -169.91)"
          fill="none"
          stroke={COLORS.outline}
          strokeWidth="1.5"
          opacity="0.3"
        />
        
        {/* Tasmania */}
        <path
          d="m597.5 759.96c0 10.34-6.37 16.98-11.64 23.98-4.59 6.1-7.42 13.26-16.28 13.26-6.47 0-6.18-5.39-8.77-8.21-5.04-5.47-8.75-11.87-8.75-24.65 0-11.93-15.51-28.87-4.46-29.61 6.86-0.47 21.8 11.54 29.1 11.54 7.43 0 15.52-5.24 18.61-5.14 4.82 0.16 2.19 7.04 2.19 18.83z"
          transform="translate(-36.443, -169.91)"
          fill="none"
          stroke={COLORS.outline}
          strokeWidth="1.5"
          opacity="0.3"
        />

        {/* Connection lines */}
        {CONNECTIONS.map(([from, to], i) => {
          // Check if this connection has an active packet
          const isActive = packets.some(p => 
            (p.from === from && p.to === to) || (p.from === to && p.to === from)
          );
          return (
            <line
              key={i}
              x1={CITIES[from].x}
              y1={CITIES[from].y}
              x2={CITIES[to].x}
              y2={CITIES[to].y}
              stroke={COLORS.accent}
              strokeWidth={isActive ? 2 : 1}
              opacity={isActive ? 0.5 : 0.15}
              filter={isActive ? "url(#packetGlowSoft)" : undefined}
              style={{ transition: 'opacity 0.3s ease, stroke-width 0.3s ease' }}
            />
          );
        })}

        {/* Melbourne orbit rings - BEHIND half */}
        {orbitElectrons.map(electron => {
          const hub = CITIES.melbourne;
          const rx = electron.radius;
          const ry = electron.radius * electron.orbitTilt;
          const rotDeg = electron.orbitRotation * (180 / Math.PI);
          
          // Interpolated color
          const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
          
          // Calculate the arc endpoints with rotation
          const cos = Math.cos(electron.orbitRotation);
          const sin = Math.sin(electron.orbitRotation);
          
          // Start point (right side of ellipse, then rotated)
          const sx = hub.x + rx * cos;
          const sy = hub.y + rx * sin;
          // End point (left side of ellipse, then rotated)
          const ex = hub.x - rx * cos;
          const ey = hub.y - rx * sin;
          
          return (
            <path
              key={`orbit-back-${electron.id}`}
              d={`M ${sx} ${sy} A ${rx} ${ry} ${rotDeg} 0 1 ${ex} ${ey}`}
              fill="none"
              stroke={currentColor}
              strokeWidth="1"
              opacity="0.12"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Melbourne orbit electrons (atom effect) - BEHIND layer */}
        {orbitElectrons.map(electron => {
          const hub = CITIES.melbourne;
          
          // Interpolated color
          const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
          
          // Calculate position on tilted, rotated ellipse
          const localX = Math.cos(electron.angle) * electron.radius;
          const localY = Math.sin(electron.angle) * electron.radius * electron.orbitTilt;
          
          // Apply orbital plane rotation
          const cos = Math.cos(electron.orbitRotation);
          const sin = Math.sin(electron.orbitRotation);
          const x = hub.x + localX * cos - localY * sin;
          const y = hub.y + localX * sin + localY * cos;
          
          // Z-depth based on angle in the tilted plane
          const zDepth = Math.sin(electron.angle);
          
          // Only render electrons that are BEHIND the hub here
          if (zDepth > -0.1) return null;
          
          // Scale size based on depth - smaller when behind
          const depthScale = 0.5 + (zDepth + 1) * 0.25;
          const size = electron.size * depthScale;
          
          // Fade opacity when behind
          const opacity = 0.3 + (zDepth + 1) * 0.2;
          
          // Trail positions
          const trailElements = [];
          if (electron.trailType === 'comet') {
            for (let i = 1; i <= 3; i++) {
              const trailAngle = electron.angle - electron.speed * i * 3;
              const trailZ = Math.sin(trailAngle);
              if (trailZ > -0.1) continue;
              
              const tLocalX = Math.cos(trailAngle) * electron.radius;
              const tLocalY = Math.sin(trailAngle) * electron.radius * electron.orbitTilt;
              const tx = hub.x + tLocalX * cos - tLocalY * sin;
              const ty = hub.y + tLocalX * sin + tLocalY * cos;
              
              const trailScale = 0.5 + (trailZ + 1) * 0.25;
              trailElements.push(
                <circle
                  key={`etrail-back-${electron.id}-${i}`}
                  cx={tx}
                  cy={ty}
                  r={electron.size * trailScale * (1 - i * 0.2)}
                  fill={currentColor}
                  opacity={opacity * (0.5 - i * 0.12)}
                />
              );
            }
          }
          
          return (
            <g key={`electron-back-${electron.id}`}>
              {trailElements}
              <circle
                cx={x}
                cy={y}
                r={size}
                fill={currentColor}
                opacity={opacity}
                filter="url(#packetGlowSoft)"
              />
            </g>
          );
        })}

        {/* City nodes */}
        {Object.entries(CITIES).map(([id, city]) => {
          const isPulsing = nodePulses[id];
          const baseRadius = city.isHub ? 8 : 5;
          // Idle breathing - gentle sine wave on size and opacity
          const breatheOffset = Math.sin(breathePhase + Object.keys(CITIES).indexOf(id) * 0.5) * 0.1;
          const breatheRadius = baseRadius * (1 + breatheOffset * 0.15);
          const breatheOpacity = 0.6 + breatheOffset * 0.1;
          
          const radius = isPulsing ? baseRadius + 2 : breatheRadius;
          const opacity = isPulsing ? 1 : breatheOpacity;
          
          return (
            <g key={id}>
              <circle
                cx={city.x}
                cy={city.y}
                r={radius}
                fill={COLORS.accent}
                opacity={opacity}
                filter={isPulsing ? "url(#pulseGlow)" : "url(#nodeGlow)"}
                style={{ transition: 'r 0.2s ease-out, opacity 0.2s ease-out' }}
              />
              <text
                x={city.x}
                y={city.y + (city.isHub ? 22 : 18)}
                fill={COLORS.accent}
                fontSize={city.isHub ? "12" : "10"}
                fontFamily="'SF Mono', 'Fira Code', 'Consolas', monospace"
                textAnchor="middle"
                opacity="0.7"
              >
                {city.label}
              </text>
            </g>
          );
        })}

        {/* Arrival bursts */}
        {bursts.map(burst => {
          const maxRadius = 25;
          const radius = maxRadius * (1 - burst.life);
          return (
            <circle
              key={`burst-${burst.id}`}
              cx={burst.x}
              cy={burst.y}
              r={radius}
              fill="none"
              stroke={burst.color}
              strokeWidth={2 * burst.life}
              opacity={burst.life * 0.6}
              filter="url(#burstGlow)"
            />
          );
        })}

        {/* Melbourne orbit rings - FRONT half */}
        {orbitElectrons.map(electron => {
          const hub = CITIES.melbourne;
          const rx = electron.radius;
          const ry = electron.radius * electron.orbitTilt;
          const rotDeg = electron.orbitRotation * (180 / Math.PI);
          
          // Interpolated color
          const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
          
          // Calculate the arc endpoints with rotation
          const cos = Math.cos(electron.orbitRotation);
          const sin = Math.sin(electron.orbitRotation);
          
          // Start point (left side of ellipse, then rotated)
          const sx = hub.x - rx * cos;
          const sy = hub.y - rx * sin;
          // End point (right side of ellipse, then rotated)
          const ex = hub.x + rx * cos;
          const ey = hub.y + rx * sin;
          
          return (
            <path
              key={`orbit-front-${electron.id}`}
              d={`M ${sx} ${sy} A ${rx} ${ry} ${rotDeg} 0 1 ${ex} ${ey}`}
              fill="none"
              stroke={currentColor}
              strokeWidth="1"
              opacity="0.25"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Melbourne orbit electrons (atom effect) - FRONT layer */}
        {orbitElectrons.map(electron => {
          const hub = CITIES.melbourne;
          
          // Interpolated color
          const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
          
          // Calculate position on tilted, rotated ellipse
          const localX = Math.cos(electron.angle) * electron.radius;
          const localY = Math.sin(electron.angle) * electron.radius * electron.orbitTilt;
          
          // Apply orbital plane rotation
          const cos = Math.cos(electron.orbitRotation);
          const sin = Math.sin(electron.orbitRotation);
          const x = hub.x + localX * cos - localY * sin;
          const y = hub.y + localX * sin + localY * cos;
          
          // Z-depth based on angle in the tilted plane
          const zDepth = Math.sin(electron.angle);
          
          // Only render electrons that are IN FRONT of the hub here
          if (zDepth <= -0.1) return null;
          
          // Scale size based on depth - larger when in front
          const depthScale = 0.7 + (zDepth + 1) * 0.3;
          const size = electron.size * depthScale;
          
          // Full opacity when in front
          const opacity = 0.7 + zDepth * 0.3;
          
          // Trail positions
          const trailElements = [];
          if (electron.trailType === 'comet') {
            for (let i = 1; i <= 3; i++) {
              const trailAngle = electron.angle - electron.speed * i * 3;
              const trailZ = Math.sin(trailAngle);
              if (trailZ <= -0.1) continue;
              
              const tLocalX = Math.cos(trailAngle) * electron.radius;
              const tLocalY = Math.sin(trailAngle) * electron.radius * electron.orbitTilt;
              const tx = hub.x + tLocalX * cos - tLocalY * sin;
              const ty = hub.y + tLocalX * sin + tLocalY * cos;
              
              const trailScale = 0.7 + (trailZ + 1) * 0.3;
              trailElements.push(
                <circle
                  key={`etrail-front-${electron.id}-${i}`}
                  cx={tx}
                  cy={ty}
                  r={electron.size * trailScale * (1 - i * 0.2)}
                  fill={currentColor}
                  opacity={opacity * (0.6 - i * 0.15)}
                />
              );
            }
          } else if (electron.trailType === 'blur') {
            const prevAngle = electron.angle - electron.speed * 6;
            const prevZ = Math.sin(prevAngle);
            if (prevZ > -0.1) {
              const pLocalX = Math.cos(prevAngle) * electron.radius;
              const pLocalY = Math.sin(prevAngle) * electron.radius * electron.orbitTilt;
              const prevX = hub.x + pLocalX * cos - pLocalY * sin;
              const prevY = hub.y + pLocalX * sin + pLocalY * cos;
              trailElements.push(
                <line
                  key={`eblur-front-${electron.id}`}
                  x1={prevX}
                  y1={prevY}
                  x2={x}
                  y2={y}
                  stroke={currentColor}
                  strokeWidth={size * 1.2}
                  strokeLinecap="round"
                  opacity={opacity * 0.5}
                  filter="url(#packetGlowSoft)"
                />
              );
            }
          } else if (electron.trailType === 'dots') {
            for (let i = 1; i <= 2; i++) {
              const trailAngle = electron.angle - electron.speed * i * 4;
              const trailZ = Math.sin(trailAngle);
              if (trailZ <= -0.1) continue;
              
              const tLocalX = Math.cos(trailAngle) * electron.radius;
              const tLocalY = Math.sin(trailAngle) * electron.radius * electron.orbitTilt;
              const tx = hub.x + tLocalX * cos - tLocalY * sin;
              const ty = hub.y + tLocalX * sin + tLocalY * cos;
              
              const trailScale = 0.7 + (trailZ + 1) * 0.3;
              trailElements.push(
                <circle
                  key={`edot-front-${electron.id}-${i}`}
                  cx={tx}
                  cy={ty}
                  r={electron.size * trailScale * 0.5}
                  fill={currentColor}
                  opacity={opacity * (0.6 - i * 0.2)}
                  filter="url(#packetGlowSoft)"
                />
              );
            }
          }
          
          return (
            <g key={`electron-front-${electron.id}`}>
              {trailElements}
              <circle
                cx={x}
                cy={y}
                r={size}
                fill={currentColor}
                filter="url(#packetGlow)"
                opacity={opacity}
              />
            </g>
          );
        })}

        {/* Sparkles */}
        {sparkles.map(sparkle => (
          <circle
            key={sparkle.id}
            cx={sparkle.x}
            cy={sparkle.y}
            r={sparkle.size * sparkle.life}
            fill={sparkle.color}
            opacity={sparkle.life * 0.8}
            filter="url(#sparkleGlow)"
          />
        ))}

        {/* Animated packets with trails */}
        {packets.map(packet => {
          const pos = getPacketPosition(packet);
          const from = CITIES[packet.from];
          const to = CITIES[packet.to];
          
          // Select glow filter based on intensity
          const glowFilter = packet.glowIntensity < 0.8 
            ? "url(#packetGlowSoft)" 
            : packet.glowIntensity > 1.2 
              ? "url(#packetGlowIntense)" 
              : "url(#packetGlow)";
          
          // Generate trail elements based on type
          const trailElements = [];
          
          if (packet.trailType === 'comet' && pos.progress > 0.05) {
            // Comet tail - fading trail behind
            for (let i = 1; i <= 5; i++) {
              const trailProgress = Math.max(0, pos.progress - i * 0.04);
              const trailT = cubicEaseOut(trailProgress);
              const tx = from.x + (to.x - from.x) * trailT;
              const ty = from.y + (to.y - from.y) * trailT;
              trailElements.push(
                <circle
                  key={`trail-${packet.id}-${i}`}
                  cx={tx}
                  cy={ty}
                  r={pos.size * (1 - i * 0.15)}
                  fill={pos.currentColor}
                  opacity={0.6 - i * 0.1}
                />
              );
            }
          } else if (packet.trailType === 'dots' && pos.progress > 0.05) {
            // Trailing dots - discrete circles following
            for (let i = 1; i <= 4; i++) {
              const trailProgress = Math.max(0, pos.progress - i * 0.06);
              const trailT = cubicEaseOut(trailProgress);
              const tx = from.x + (to.x - from.x) * trailT;
              const ty = from.y + (to.y - from.y) * trailT;
              trailElements.push(
                <circle
                  key={`trail-${packet.id}-${i}`}
                  cx={tx}
                  cy={ty}
                  r={2 - i * 0.3}
                  fill={pos.currentColor}
                  opacity={0.7 - i * 0.15}
                  filter="url(#packetGlowSoft)"
                />
              );
            }
          } else if (packet.trailType === 'blur') {
            // Motion blur - stretched ellipse in direction of travel
            const blurLength = 15 * (0.5 + pos.progress * 0.5);
            const dx = Math.cos(pos.angle) * blurLength;
            const dy = Math.sin(pos.angle) * blurLength;
            trailElements.push(
              <line
                key={`blur-${packet.id}`}
                x1={pos.x - dx}
                y1={pos.y - dy}
                x2={pos.x}
                y2={pos.y}
                stroke={pos.currentColor}
                strokeWidth={pos.size * 1.5}
                strokeLinecap="round"
                opacity={0.4}
                filter="url(#packetGlowSoft)"
              />
            );
          }
          
          return (
            <g key={packet.id}>
              {trailElements}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={pos.size}
                fill={pos.currentColor}
                filter={glowFilter}
              />
            </g>
          );
        })}
      </svg>

      {/* Title */}
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '3rem',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Screen reader accessible title */}
        <span 
          style={{ 
            position: 'absolute', 
            width: 1, 
            height: 1, 
            padding: 0, 
            margin: -1, 
            overflow: 'hidden', 
            clip: 'rect(0, 0, 0, 0)', 
            border: 0 
          }}
          aria-live="polite"
        >
          bren.id.au
        </span>
        <h1 
          aria-hidden="true"
          style={{
          fontFamily: titleFont,
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          color: COLORS.accent,
          letterSpacing: '0.1em',
          fontWeight: 400,
          opacity: 0.9,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}>
          {bootPrefix && (
            <span style={{ color: '#34d399', marginRight: '0.25em' }}>{bootPrefix}</span>
          )}
          {titleChars.map((c, i) => (
            <span 
              key={i} 
              style={{ 
                color: c.color,
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {c.char}
              {titleBursts.filter(b => b.index === i).map(burst => (
                <span
                  key={burst.id}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${20 * (1 - burst.life) + 5}px`,
                    height: `${20 * (1 - burst.life) + 5}px`,
                    borderRadius: '50%',
                    border: `2px solid ${COLORS.accent}`,
                    opacity: burst.life * 0.8,
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </span>
          ))}
          {bootPrefix && (
              <span style={{ 
                display: 'inline-block',
                width: '0.6em',
                textAlign: 'left',
              }}>
                <span style={{ 
                  opacity: showCursor ? 1 : 0,
                  animation: showCursor ? 'blink 1s infinite' : 'none',
                }}>_</span>
              </span>
            )}
        </h1>
        <style>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AustraliaNetwork;
