import React, { useEffect, useRef } from 'react';
import { createCosmos } from './engine';

// Full-viewport canvas behind everything. The engine owns the animation loop;
// React only mounts it once.
const Cosmos = () => {
  const ref = useRef(null);
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return createCosmos(ref.current, { reducedMotion });
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
};

export default Cosmos;
