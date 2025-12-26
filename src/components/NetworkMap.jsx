import React from 'react';
import { CITIES, CONNECTIONS, COLORS, lerpColor } from '../constants';

// Australia path data
const AUSTRALIA_MAINLAND = "m708.4 502.01c0 37.16-11.92 65.02-27.17 90.8-3.57 6.03-8.05 7.41-12.34 12.89-9.93 12.7-5.87 26.34-19.51 36.53-11.91 8.9-14.48 24.4-14.96 40.51-0.23 7.49-16.51-1.37-21.05 3.27-2.6 2.65-11.77-1.05-15.39 0.98-7.92 4.44-14.63 14.82-23.89 19.37-7.4 3.64-12.6-16.52-21.87-15.24-15.76 2.18-33.59-4.74-52.76-3.26-8.96 0.69-12.09-18.46-21.25-17.17-12.83 1.81 0.4-46.57-11.35-37.37-12.99 10.17-7.22-22.08-19.92-22.08-5.47 0 7.66-30.14 2.17-30.19-2.36-0.02-32.59 33.65-33.93 31.7-4.21-6.11-7.87-20.52-15.34-26.81-5.25-4.43-7.9-11.28-13.4-15.09-8.99-6.23-16.11-2.36-25.66-7.12-5.77-2.87-11.54-7.1-17.37-6.82-8.84 0.42-14.53 2.38-27.09 3.39-20.5 1.66-34.66 14.44-55.05 14.11-17.02-0.28-31.21 35.1-47.69 32.77-18.03-2.55-32.34 4.29-45.13 4.12-11.01-0.14-20.45 29.56-30.42 25.02-14.24-6.49-36.13 2.41-47.822-13.43-5.486-7.44 12.562-6.29 8.105-15.84-2.685-5.75 0.519-12.17 0.268-19.57-0.192-5.68-3.656-12.27-5.863-17.55-2.267-5.42-7.544-9.92-10.006-16.38-1.976-5.18-0.969-12.2-3.938-17.57-4.309-7.8-11.825-15.42-16.082-22.92-2.189-3.86-1.425-8.14-3.718-11.67-6.669-10.26-17.693-14.85-21.19-23.52-2.934-7.27 20.25 5.54 21.256 0.17 0.721-3.84-6.174-8.59-10.094-16.02-4.882-9.25-7.114-21.28-7.114-25.05 0-9.54-2.331-27.06 0.883-34.25 3.198-7.15 8.255-2.79 14.227-7.64 9.028-7.33 17.724-16.67 30.774-23.07 4.513-2.21 11.229-1.81 16.214-3.81 19.33-7.77 39.47-16.91 57.97-26.47 8.73-4.52 11.2-20.1 19.53-25.23 3.65-2.25-6.66-13.07-3.05-15.43 5.29-3.45 1.29-10.87 6.56-14.56 4.16-2.91 15.25 14.97 19.34 11.85 2.64-2.02-4.04-19.61-1.45-21.77 3.35-2.8 15.21 7.51 18.56 4.62 2.61-2.26-7.96-18.51-5.38-20.86 13.61-12.45 31.83-22.7 47.09-34.28 4.46-3.39 19.79 21.93 24.32 18.69 7.28-5.22 18.8 10.12 25.57 3.38 5.6-5.58-11.58-7.92-6.34-15.39 6.96-9.89 12.74-23.67 24.48-33.89 7.92-6.9 20.45 1.94 29.93-2.47 3.02-1.4 4.15-6.15-0.11-9.64-4.05-3.31-13.5-5.34-11.15-7.84 3.29-3.51 22.32 6.61 33.45 6 5.58-0.31 11.7 4.26 13.25 4.26 5.2 0 11.92 5.49 17.06 5.64 3.63 0.1 5.11-5.18 8.7-5.01 7.95 0.38 11.26 2.97 19.04 3.71 7.4 0.69 4.02 10.28-0.88 15.7-2.52 2.79-16.91 7.68-12.68 13.14 4.31 5.55-14.81 19.29-8.17 23.4 25.99 16.08 49.08 45.95 79.91 53.95 24.99 6.49 26.96-48.57 29.67-73.46 1.71-15.72 17.78-64.12 21.46-53.82 3.84 10.76 7.9 26.5 17.87 47.51 1.72 3.63-0.1 16.99 2.24 20.9 2.39 4 7.19 0.39 11.75 2.08 4.26 1.59 8.24 8.45 11.51 12.52 5.2 6.46-1.54 28.67 4.42 35.58 8.16 9.47 4.05 39.01 13.49 48.28 3.76 3.69 8.43-2.83 12.43 0.6 5.72 4.9 17.56 12.78 21.35 19.42 2.76 4.85-2.74 8.67 1.64 11.97 7.32 5.5 9.42 27.64 16.84 32.44 3.04 1.96 0.69-6.33 8.41-0.84 5.68 4.04 3.43 15.89 7.3 21.06 5.85 7.8 19.16 23.36 23.89 30.4 10.61 15.8 4.65 39.4 4.65 47.67z";

const TASMANIA = "m597.5 759.96c0 10.34-6.37 16.98-11.64 23.98-4.59 6.1-7.42 13.26-16.28 13.26-6.47 0-6.18-5.39-8.77-8.21-5.04-5.47-8.75-11.87-8.75-24.65 0-11.93-15.51-28.87-4.46-29.61 6.86-0.47 21.8 11.54 29.1 11.54 7.43 0 15.52-5.24 18.61-5.14 4.82 0.16 2.19 7.04 2.19 18.83z";

// Easing function
const cubicEaseOut = (t) => 1 - Math.pow(1 - t, 3);

const NetworkMap = ({ 
  packets, 
  orbitElectrons, 
  pulses, 
  sparkles, 
  bursts, 
  ambientParticles,
  breathePhase 
}) => {
  const hub = CITIES.melbourne;

  return (
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
        
        {/* Packet glow filters */}
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

        <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="sparkleGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="burstGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
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
        d={AUSTRALIA_MAINLAND}
        transform="translate(-36.443, -169.91)"
        fill="none"
        stroke={COLORS.outline}
        strokeWidth="1.5"
        opacity="0.3"
      />
      
      {/* Tasmania */}
      <path
        d={TASMANIA}
        transform="translate(-36.443, -169.91)"
        fill="none"
        stroke={COLORS.outline}
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Melbourne orbit rings - BEHIND half */}
      {orbitElectrons.map(electron => {
        const rx = electron.radius;
        const ry = electron.radius * electron.orbitTilt;
        const rotDeg = electron.orbitRotation * (180 / Math.PI);
        
        const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
        
        const cos = Math.cos(electron.orbitRotation);
        const sin = Math.sin(electron.orbitRotation);
        
        const sx = hub.x + rx * cos;
        const sy = hub.y + rx * sin;
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

      {/* Melbourne orbit electrons - BEHIND layer */}
      {orbitElectrons.map(electron => {
        const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
        
        const localX = Math.cos(electron.angle) * electron.radius;
        const localY = Math.sin(electron.angle) * electron.radius * electron.orbitTilt;
        
        const cos = Math.cos(electron.orbitRotation);
        const sin = Math.sin(electron.orbitRotation);
        const x = hub.x + localX * cos - localY * sin;
        const y = hub.y + localX * sin + localY * cos;
        
        const zDepth = Math.sin(electron.angle);
        
        if (zDepth > -0.1) return null;
        
        const depthScale = 0.5 + (zDepth + 1) * 0.25;
        const size = electron.size * depthScale;
        const opacity = 0.3 + (zDepth + 1) * 0.2;
        
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

      {/* Connection lines */}
      {CONNECTIONS.map(([from, to], i) => {
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
            strokeWidth={isActive ? "2" : "1"}
            opacity={isActive ? 0.6 : 0.15}
            strokeLinecap="round"
          />
        );
      })}

      {/* Packets with trails */}
      {packets.map(packet => {
        const fromCity = CITIES[packet.from];
        const toCity = CITIES[packet.to];
        const elapsed = Date.now() - packet.startTime;
        const progress = Math.min(elapsed / packet.duration, 1);
        const t = cubicEaseOut(progress);
        
        const x = fromCity.x + (toCity.x - fromCity.x) * t;
        const y = fromCity.y + (toCity.y - fromCity.y) * t;
        
        const breathe = Math.sin(breathePhase * 2 + packet.phaseOffset);
        const baseSize = packet.size + breathe * 0.5;
        
        const trailElements = [];
        
        if (packet.trailType === 'comet') {
          for (let i = 1; i <= 4; i++) {
            const trailT = Math.max(0, t - i * 0.08);
            const trailX = fromCity.x + (toCity.x - fromCity.x) * trailT;
            const trailY = fromCity.y + (toCity.y - fromCity.y) * trailT;
            trailElements.push(
              <circle
                key={`trail-${packet.id}-${i}`}
                cx={trailX}
                cy={trailY}
                r={baseSize * (1 - i * 0.15)}
                fill={packet.color}
                opacity={0.6 - i * 0.12}
                filter="url(#packetGlowSoft)"
              />
            );
          }
        } else if (packet.trailType === 'blur') {
          const trailT = Math.max(0, t - 0.15);
          const trailX = fromCity.x + (toCity.x - fromCity.x) * trailT;
          const trailY = fromCity.y + (toCity.y - fromCity.y) * trailT;
          trailElements.push(
            <line
              key={`blur-${packet.id}`}
              x1={trailX}
              y1={trailY}
              x2={x}
              y2={y}
              stroke={packet.color}
              strokeWidth={baseSize * 1.5}
              strokeLinecap="round"
              opacity={0.5}
              filter="url(#packetGlowSoft)"
            />
          );
        } else if (packet.trailType === 'dots') {
          for (let i = 1; i <= 3; i++) {
            const trailT = Math.max(0, t - i * 0.1);
            const trailX = fromCity.x + (toCity.x - fromCity.x) * trailT;
            const trailY = fromCity.y + (toCity.y - fromCity.y) * trailT;
            trailElements.push(
              <circle
                key={`dot-${packet.id}-${i}`}
                cx={trailX}
                cy={trailY}
                r={baseSize * 0.4}
                fill={packet.color}
                opacity={0.7 - i * 0.2}
                filter="url(#packetGlowSoft)"
              />
            );
          }
        }
        
        const glowFilter = breathe > 0.5 ? "url(#packetGlowIntense)" : "url(#packetGlow)";
        
        return (
          <g key={packet.id}>
            {trailElements}
            <circle
              cx={x}
              cy={y}
              r={baseSize}
              fill={packet.color}
              filter={glowFilter}
              opacity={0.9}
            />
          </g>
        );
      })}

      {/* Pulses */}
      {pulses.map(pulse => (
        <circle
          key={pulse.id}
          cx={CITIES[pulse.city].x}
          cy={CITIES[pulse.city].y}
          r={pulse.radius * (1 - pulse.life) * 2}
          fill="none"
          stroke={pulse.color}
          strokeWidth={2 * pulse.life}
          opacity={pulse.life * 0.6}
          filter="url(#pulseGlow)"
        />
      ))}

      {/* City nodes */}
      {Object.entries(CITIES).map(([id, city]) => {
        const breathe = Math.sin(breathePhase);
        const baseSize = city.isHub ? 8 : 5;
        const size = baseSize + (city.isHub ? breathe * 2 : breathe * 0.5);
        
        return (
          <g key={id}>
            {city.isHub && (
              <circle
                cx={city.x}
                cy={city.y}
                r={size + 4 + breathe * 2}
                fill="none"
                stroke={COLORS.accent}
                strokeWidth="1"
                opacity={0.3 + breathe * 0.1}
              />
            )}
            <circle
              cx={city.x}
              cy={city.y}
              r={size}
              fill={city.isHub ? COLORS.accent : COLORS.accent}
              filter="url(#nodeGlow)"
              opacity={city.isHub ? 1 : 0.8}
            />
            <text
              x={city.x + (id === 'perth' ? -10 : 15)}
              y={city.y + (id === 'darwin' || id === 'brisbane' ? -10 : 5)}
              fill={COLORS.accent}
              fontSize="12"
              opacity="0.7"
              textAnchor={id === 'perth' ? 'end' : 'start'}
            >
              {city.label}
            </text>
          </g>
        );
      })}

      {/* Melbourne orbit rings - FRONT half */}
      {orbitElectrons.map(electron => {
        const rx = electron.radius;
        const ry = electron.radius * electron.orbitTilt;
        const rotDeg = electron.orbitRotation * (180 / Math.PI);
        
        const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
        
        const cos = Math.cos(electron.orbitRotation);
        const sin = Math.sin(electron.orbitRotation);
        
        const sx = hub.x - rx * cos;
        const sy = hub.y - rx * sin;
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

      {/* Melbourne orbit electrons - FRONT layer */}
      {orbitElectrons.map(electron => {
        const currentColor = lerpColor(electron.color, electron.targetColor, electron.colorProgress);
        
        const localX = Math.cos(electron.angle) * electron.radius;
        const localY = Math.sin(electron.angle) * electron.radius * electron.orbitTilt;
        
        const cos = Math.cos(electron.orbitRotation);
        const sin = Math.sin(electron.orbitRotation);
        const x = hub.x + localX * cos - localY * sin;
        const y = hub.y + localX * sin + localY * cos;
        
        const zDepth = Math.sin(electron.angle);
        
        if (zDepth <= -0.1) return null;
        
        const depthScale = 0.7 + (zDepth + 1) * 0.3;
        const size = electron.size * depthScale;
        const opacity = 0.7 + zDepth * 0.3;
        
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

      {/* Bursts */}
      {bursts.map(burst => (
        <circle
          key={burst.id}
          cx={burst.x}
          cy={burst.y}
          r={burst.radius * (1 - burst.life)}
          fill="none"
          stroke={burst.color}
          strokeWidth={2 * burst.life}
          opacity={burst.life * 0.7}
          filter="url(#burstGlow)"
        />
      ))}
    </svg>
  );
};

export default NetworkMap;
