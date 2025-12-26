import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpaceBackground from './components/SpaceBackground';
import AnimatedTitle from './components/AnimatedTitle';
import NetworkMap from './components/NetworkMap';
import ContactCard from './components/ContactCard';
import { 
  CONNECTIONS, 
  CITIES, 
  getRandomPacketColor, 
  getRandomTrailType 
} from './constants';

const LandingPage = () => {
  // Animation state
  const [breathePhase, setBreathePhase] = useState(0);
  
  // Network visualization state
  const [packets, setPackets] = useState([]);
  const [orbitElectrons, setOrbitElectrons] = useState([]);
  const [pulses, setPulses] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [ambientParticles, setAmbientParticles] = useState([]);
  
  // Refs
  const packetIdRef = useRef(0);
  const effectIdRef = useRef(0);

  // Helper function for random connection
  const getRandomConnection = useCallback(() => {
    return CONNECTIONS[Math.floor(Math.random() * CONNECTIONS.length)];
  }, []);

  // Initialize particles and electrons
  useEffect(() => {
    // Create ambient background particles
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: i,
        x: -50 + Math.random() * 775,
        y: -150 + Math.random() * 830,
        size: 0.3 + Math.random() * 0.7,
        opacity: 0.05 + Math.random() * 0.1,
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
        colorSpeed: 0.005 + Math.random() * 0.01,
        trailType: getRandomTrailType(),
        size: 2 + Math.random() * 1.5,
        orbitTilt: 0.3 + Math.random() * 0.3,
        orbitRotation: (i * Math.PI / 3) + (Math.random() - 0.5) * 0.5,
      });
    }
    setOrbitElectrons(electrons);
  }, []);

  // Spawn packet function
  const spawnPacket = useCallback((fromCity, toCity, chain = 0) => {
    const baseColor = getRandomPacketColor();
    const newPacket = {
      id: packetIdRef.current++,
      from: fromCity,
      to: toCity,
      startTime: Date.now(),
      duration: 800 + Math.random() * 400,
      color: baseColor,
      size: 3 + Math.random() * 2,
      phaseOffset: Math.random() * Math.PI * 2,
      trailType: getRandomTrailType(),
      chain,
    };
    setPackets(prev => [...prev, newPacket]);
    
    // Spawn pulse at origin
    setPulses(prev => [...prev, {
      id: effectIdRef.current++,
      city: fromCity,
      color: baseColor,
      life: 1,
      radius: 15,
    }]);
    
    return newPacket;
  }, []);

  // Main animation loop
  useEffect(() => {
    let animationFrame;
    
    const animate = () => {
      const now = Date.now();
      
      // Update breathe phase
      setBreathePhase(prev => prev + 0.02);
      
      // Update orbit electrons
      setOrbitElectrons(prev => prev.map(e => {
        let newProgress = e.colorProgress + e.colorSpeed;
        let newColor = e.color;
        let newTargetColor = e.targetColor;
        
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

      // Update bursts
      setBursts(prev => prev
        .map(b => ({ ...b, life: b.life - 0.04 }))
        .filter(b => b.life > 0)
      );

      // Update sparkles
      setSparkles(prev => prev
        .map(s => ({ ...s, life: s.life - 0.05 }))
        .filter(s => s.life > 0)
      );
      
      // Update pulses
      setPulses(prev => prev
        .map(p => ({ ...p, life: p.life - 0.03 }))
        .filter(p => p.life > 0)
      );

      // Check for completed packets
      setPackets(prev => {
        const completed = [];
        const active = [];
        
        prev.forEach(packet => {
          const elapsed = now - packet.startTime;
          if (elapsed >= packet.duration) {
            completed.push(packet);
          } else {
            active.push(packet);
          }
        });

        // Handle completed packets
        completed.forEach(packet => {
          const toCity = CITIES[packet.to];
          
          // Burst at destination
          setBursts(b => [...b, {
            id: effectIdRef.current++,
            x: toCity.x,
            y: toCity.y,
            color: packet.color,
            life: 1,
            radius: 20 + Math.random() * 10,
          }]);
          
          // Sparkles at destination
          const newSparkles = [];
          for (let i = 0; i < 3; i++) {
            newSparkles.push({
              id: effectIdRef.current++,
              x: toCity.x + (Math.random() - 0.5) * 20,
              y: toCity.y + (Math.random() - 0.5) * 20,
              color: packet.color,
              life: 1,
              size: 1.5 + Math.random(),
            });
          }
          if (newSparkles.length > 0) {
            setSparkles(prev => [...prev, ...newSparkles].slice(-20));
          }
          
          // Chain reaction
          if (packet.chain < 2 && Math.random() > 0.4) {
            setTimeout(() => {
              const connectedCities = CONNECTIONS
                .filter(c => c.includes(packet.to))
                .map(c => c[0] === packet.to ? c[1] : c[0])
                .filter(c => c !== packet.from);
              
              if (connectedCities.length > 0) {
                const nextCity = connectedCities[Math.floor(Math.random() * connectedCities.length)];
                spawnPacket(packet.to, nextCity, packet.chain + 1);
              }
            }, 100 + Math.random() * 200);
          }
        });

        return active;
      });
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [spawnPacket]);

  // Packet spawner
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const [from, to] = getRandomConnection();
      const direction = Math.random() > 0.5;
      spawnPacket(direction ? from : to, direction ? to : from);
    }, 2000 + Math.random() * 1500);

    // Initial packets
    setTimeout(() => {
      spawnPacket('melbourne', 'sydney');
      setTimeout(() => spawnPacket('perth', 'melbourne'), 500);
      setTimeout(() => spawnPacket('brisbane', 'darwin'), 1000);
    }, 500);

    return () => clearInterval(spawnInterval);
  }, [spawnPacket, getRandomConnection]);

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
      <SpaceBackground breathePhase={breathePhase} />
      
      <NetworkMap
        packets={packets}
        orbitElectrons={orbitElectrons}
        pulses={pulses}
        sparkles={sparkles}
        bursts={bursts}
        ambientParticles={ambientParticles}
        breathePhase={breathePhase}
      />
      
      <AnimatedTitle />
      
      <ContactCard />
    </div>
  );
};

export default LandingPage;
