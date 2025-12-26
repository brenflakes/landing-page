import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FONTS, TITLE_TEXT, GLITCH_CHARS, COLORS } from '../constants';

const AnimatedTitle = () => {
  const [titleChars, setTitleChars] = useState([]);
  const [titleFont, setTitleFont] = useState(FONTS[0]);
  const [bootPrefix, setBootPrefix] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const [charBursts, setCharBursts] = useState([]);
  const titleAnimationRef = useRef(null);

  const getRandomChar = () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];

  // Animation: Matrix-style decode
  const matrixDecode = useCallback(() => {
    if (titleAnimationRef.current) {
      clearTimeout(titleAnimationRef.current);
    }
    setShowCursor(false);
    setBootPrefix('');
    
    const animationId = Date.now();
    titleAnimationRef.animationId = animationId;
    
    // Lock times: complete within ~5 seconds so cycle has breathing room
    const lockTimes = TITLE_TEXT.split('').map((_, i) => i * 0.4 + Math.random() * 2);
    
    setTitleChars(TITLE_TEXT.split('').map((char, i) => ({
      char: getRandomChar(),
      target: char,
      locked: false,
      lockTime: lockTimes[i],
      color: COLORS.accent,
    })));
    
    const startTime = Date.now();
    
    const iterate = () => {
      if (titleAnimationRef.animationId !== animationId) return;
      
      const elapsed = (Date.now() - startTime) / 1000;
      
      setTitleChars(prev => prev.map((c, i) => {
        if (elapsed >= c.lockTime && !c.locked) {
          return { ...c, char: c.target, locked: true };
        }
        if (!c.locked) {
          return { ...c, char: getRandomChar() };
        }
        return c;
      }));
      
      const allLocked = lockTimes.every(t => elapsed >= t);
      if (!allLocked) {
        titleAnimationRef.current = setTimeout(iterate, 60);
      } else {
        setTitleChars(TITLE_TEXT.split('').map(char => ({
          char,
          target: char,
          locked: true,
          color: COLORS.accent,
        })));
      }
    };
    
    titleAnimationRef.current = setTimeout(iterate, 60);
  }, []);

  // Animation: Glitch scramble
  const glitchScramble = useCallback(() => {
    if (titleAnimationRef.current) {
      clearTimeout(titleAnimationRef.current);
    }
    setShowCursor(false);
    setBootPrefix('');
    
    const animationId = Date.now();
    titleAnimationRef.animationId = animationId;
    
    setTitleChars(TITLE_TEXT.split('').map(char => ({
      char,
      target: char,
      locked: true,
      color: COLORS.accent,
    })));
    
    let glitchCount = 0;
    const maxGlitches = 8;
    let resetTimeout = null;
    
    const doGlitch = () => {
      if (titleAnimationRef.animationId !== animationId) return;
      
      if (glitchCount >= maxGlitches) {
        setTitleChars(TITLE_TEXT.split('').map(char => ({
          char,
          target: char,
          locked: true,
          color: COLORS.accent,
        })));
        return;
      }
      
      const glitchLength = 1 + Math.floor(Math.random() * 3);
      const startIdx = Math.floor(Math.random() * (TITLE_TEXT.length - glitchLength));
      const glitchIndices = Array.from({ length: glitchLength }, (_, i) => startIdx + i);
      
      setTitleChars(TITLE_TEXT.split('').map((char, i) => {
        if (glitchIndices.includes(i)) {
          return { 
            char: getRandomChar(),
            target: char,
            locked: true,
            color: Math.random() > 0.5 ? '#a78bfa' : '#22d3ee',
          };
        }
        return { char, target: char, locked: true, color: COLORS.accent };
      }));
      
      if (resetTimeout) clearTimeout(resetTimeout);
      
      resetTimeout = setTimeout(() => {
        if (titleAnimationRef.animationId !== animationId) return;
        setTitleChars(TITLE_TEXT.split('').map(char => ({
          char,
          target: char,
          locked: true,
          color: COLORS.accent,
        })));
      }, 80);
      
      glitchCount++;
      titleAnimationRef.current = setTimeout(doGlitch, 150 + Math.random() * 300);
    };
    
    titleAnimationRef.current = setTimeout(doGlitch, 500);
  }, []);

  // Animation: Packet arrival
  const packetArrival = useCallback(() => {
    if (titleAnimationRef.current) {
      clearTimeout(titleAnimationRef.current);
    }
    setShowCursor(false);
    setBootPrefix('');
    setCharBursts([]);
    
    const animationId = Date.now();
    titleAnimationRef.animationId = animationId;
    
    setTitleChars(TITLE_TEXT.split('').map(char => ({
      char: '',
      target: char,
      locked: false,
      color: COLORS.accent,
    })));
    
    const state = { charIndex: 0 };
    
    const revealChar = () => {
      if (titleAnimationRef.animationId !== animationId) return;
      if (state.charIndex >= TITLE_TEXT.length) return;
      
      const idx = state.charIndex;
      setTitleChars(prev => prev.map((c, i) => 
        i === idx ? { ...c, char: c.target, locked: true } : c
      ));
      
      setCharBursts(prev => [...prev, {
        id: `burst-${idx}-${Date.now()}`,
        charIndex: idx,
        life: 1,
      }]);
      
      state.charIndex++;
      titleAnimationRef.current = setTimeout(revealChar, 80 + Math.random() * 60);
    };
    
    titleAnimationRef.current = setTimeout(revealChar, 300);
  }, []);

  // Animation: Boot sequence
  const bootSequence = useCallback(() => {
    if (titleAnimationRef.current) {
      clearTimeout(titleAnimationRef.current);
    }
    
    setTitleChars(TITLE_TEXT.split('').map(char => ({
      char: '',
      target: char,
      locked: true,
      color: COLORS.accent,
    })));
    setBootPrefix('');
    setShowCursor(true);
    
    const animationId = Date.now();
    titleAnimationRef.animationId = animationId;
    
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

  // Update char bursts
  useEffect(() => {
    if (charBursts.length === 0) return;
    
    const interval = setInterval(() => {
      setCharBursts(prev => 
        prev
          .map(b => ({ ...b, life: b.life - 0.1 }))
          .filter(b => b.life > 0)
      );
    }, 30);
    
    return () => clearInterval(interval);
  }, [charBursts.length > 0]);

  // Cycle through animations
  useEffect(() => {
    const animations = [matrixDecode, glitchScramble, packetArrival, bootSequence];
    let cycleTimeout;
    
    const runAnimation = () => {
      titleAnimationRef.animationId = null;
      if (titleAnimationRef.current) {
        clearTimeout(titleAnimationRef.current);
      }
      
      setTitleFont(FONTS[Math.floor(Math.random() * FONTS.length)]);
      const currentIndex = Math.floor(Math.random() * animations.length);
      animations[currentIndex]();
      
      cycleTimeout = setTimeout(() => {
        runAnimation();
      }, 10000 + Math.random() * 5000);
    };
    
    cycleTimeout = setTimeout(runAnimation, 500);
    
    return () => {
      clearTimeout(cycleTimeout);
      titleAnimationRef.animationId = null;
      if (titleAnimationRef.current) {
        clearTimeout(titleAnimationRef.current);
      }
    };
  }, [matrixDecode, glitchScramble, packetArrival, bootSequence]);

  return (
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
        }}
      >
        {bootPrefix && (
          <span style={{ color: '#22d3ee', marginRight: '0.2em' }}>{bootPrefix}</span>
        )}
        {titleChars.map((c, i) => (
          <span 
            key={i} 
            style={{ 
              color: c.color,
              transition: c.locked ? 'none' : 'color 0.1s',
              position: 'relative',
            }}
          >
            {c.char}
            {/* Char burst effect */}
            {charBursts
              .filter(b => b.charIndex === i)
              .map(burst => (
                <span
                  key={burst.id}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${(1 - burst.life) * 30}px`,
                    height: `${(1 - burst.life) * 30}px`,
                    border: `1px solid ${COLORS.accent}`,
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: burst.life * 0.5,
                    pointerEvents: 'none',
                  }}
                />
              ))
            }
          </span>
        ))}
        {showCursor && (
          <span 
            style={{ 
              display: 'inline-block',
              width: '0.6em',
              marginLeft: '0.1em',
            }}
          >
            <span
              style={{
                animation: 'blink 1s step-end infinite',
                color: '#22d3ee',
              }}
            >
              _
            </span>
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
  );
};

export default AnimatedTitle;
