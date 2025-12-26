import React from 'react';
import { COLORS } from '../constants';

// SVG Icons
const Icons = {
  github: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"/>
    </svg>
  ),
};

const LINKS = [
  { icon: 'github', label: 'GitHub', href: 'https://github.com/brenflakes' },
  { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/brendan-albury-a8a71886' },
  { icon: 'x', label: 'X', href: 'https://x.com/BrendanAlb48051' },
  { icon: 'facebook', label: 'Facebook', href: 'https://facebook.com/brenflakes' },
  { icon: 'discord', label: 'Discord', href: null, copyText: 'bren_99' },
  { icon: 'email', label: 'Email', href: 'mailto:hello@bren.id.au' },
];

const ContactCard = () => {
  const [copied, setCopied] = React.useState(false);

  const handleDiscordClick = (e, copyText) => {
    e.preventDefault();
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const styles = {
    card: {
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(88, 166, 255, 0.2)',
      borderRadius: '8px',
      padding: '1.5rem 2rem',
      maxWidth: '500px',
      textAlign: 'center',
      marginTop: '2rem',
      position: 'relative',
      zIndex: 1,
    },
    title: {
      fontSize: '0.95rem',
      color: COLORS.accent,
      marginBottom: '0.5rem',
      fontWeight: 400,
    },
    bio: {
      fontSize: '0.8rem',
      opacity: 0.6,
      lineHeight: 1.6,
      marginBottom: '0.25rem',
      color: COLORS.accent,
    },
    divider: {
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.3), transparent)',
      margin: '1rem 0',
    },
    badges: {
      display: 'flex',
      gap: '0.6rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      background: 'rgba(88, 166, 255, 0.1)',
      border: '1px solid rgba(88, 166, 255, 0.3)',
      borderRadius: '20px',
      padding: '0.4rem 0.75rem',
      fontSize: '0.7rem',
      cursor: 'pointer',
      transition: 'all 0.3s',
      textDecoration: 'none',
      color: COLORS.accent,
    },
    tooltip: {
      position: 'absolute',
      top: '-30px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(34, 211, 238, 0.9)',
      color: '#0a0a0f',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.7rem',
      whiteSpace: 'nowrap',
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>Production Support Manager based in Melbourne</div>
      <div style={styles.bio}>Payments Nerd • Tech Enthusiast • Homelab Builder</div>
      <div style={styles.bio}>3D Printing Addict • F1 Tragic • AI Tinkerer</div>
      <div style={styles.divider} />
      <div style={styles.badges}>
        {LINKS.map((link) => {
          if (link.copyText) {
            // Discord - copy to clipboard
            return (
              <div
                key={link.label}
                style={{ position: 'relative' }}
              >
                <a
                  href="#"
                  onClick={(e) => handleDiscordClick(e, link.copyText)}
                  style={styles.badge}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(88, 166, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(88, 166, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {Icons[link.icon]}
                  {link.label}
                </a>
                {copied && (
                  <div style={styles.tooltip}>Copied!</div>
                )}
              </div>
            );
          }
          
          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.badge}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(88, 166, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(88, 166, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {Icons[link.icon]}
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default ContactCard;
