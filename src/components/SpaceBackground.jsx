import React, { useState, useEffect, useRef } from 'react';
import { getRandomStarColor } from '../constants';

const SpaceBackground = ({ breathePhase }) => {
  const [stars, setStars] = useState([]);
  const [nebulas, setNebulas] = useState([]);
  const [galaxies, setGalaxies] = useState([]);
  const [shootingStars, setShootingStars] = useState([]);
  const shootingStarIdRef = useRef(0);

  // Initialize space elements
  useEffect(() => {
    // Create stars in layers
    const newStars = [];
    
    // Layer 1: Distant small stars
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
    
    // Layer 3: Close bright stars
    for (let i = 0; i < 10; i++) {
      newStars.push({
        id: `star-close-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 1.5,
        baseOpacity: 0.6 + Math.random() * 0.4,
        color: getRandomStarColor(),
        twinkleSpeed: 0.2 + Math.random() * 0.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: 'close',
      });
    }
    setStars(newStars);

    // Create nebula patches
    setNebulas([
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
    ]);

    // Create distant galaxies
    const newGalaxies = [];
    for (let i = 0; i < 5; i++) {
      newGalaxies.push({
        id: `galaxy-${i}`,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        width: 3 + Math.random() * 4,
        height: 1 + Math.random() * 2,
        rotation: Math.random() * 360,
        opacity: 0.1 + Math.random() * 0.15,
      });
    }
    setGalaxies(newGalaxies);
  }, []);

  // Shooting star spawner
  useEffect(() => {
    const spawnShootingStar = () => {
      const id = shootingStarIdRef.current++;
      const newStar = {
        id,
        startX: Math.random() * 80,
        startY: Math.random() * 40,
        angle: Math.PI / 4 + (Math.random() - 0.5),
        length: 15 + Math.random() * 25,
        duration: 600 + Math.random() * 400,
        color: Math.random() > 0.8 ? '#22d3ee' : '#ffffff',
        startTime: Date.now(),
      };

      setShootingStars(prev => [...prev, newStar]);

      setTimeout(() => {
        setShootingStars(prev => prev.filter(s => s.id !== id));
      }, newStar.duration + 100);
    };

    let shootingStarTimeout;
    const scheduleNext = () => {
      shootingStarTimeout = setTimeout(() => {
        spawnShootingStar();
        scheduleNext();
      }, 8000 + Math.random() * 7000);
    };
    scheduleNext();

    return () => clearTimeout(shootingStarTimeout);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    }}>
      {/* Nebula patches */}
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
        
        const travelDistance = star.length * 4;
        const currentTravel = progress * travelDistance;
        
        const x = star.startX + Math.cos(star.angle) * currentTravel;
        const y = star.startY + Math.sin(star.angle) * currentTravel;
        
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
  );
};

export default SpaceBackground;
