import React from 'react';
import Cosmos from './cosmos/Cosmos';
import AnimatedTitle from './components/AnimatedTitle';
import ContactCard from './components/ContactCard';

// v2: the solar system fills the viewport; title and card sit in the lower part of the screen.
const LandingPage = () => (
  <div
    style={{
      minHeight: '100svh',
      background: 'radial-gradient(ellipse at 50% 40%, #0d0d14 0%, #070709 55%, #030304 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: 'clamp(1rem, 3vw, 2rem)',
      paddingBottom: 'clamp(1.5rem, 5vh, 3rem)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Cosmos />
    <AnimatedTitle />
    <ContactCard />
  </div>
);

export default LandingPage;
