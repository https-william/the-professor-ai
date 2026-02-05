
// The Professor: Neural Sanctum Design System

export const theme = {
  colors: {
    // Backgrounds
    void: {
      deep: '#050505', // Main background
      surface: '#0A0A0C', // Cards/Modals
      overlay: 'rgba(5, 5, 5, 0.8)', // Glassmorphism overlay
    },
    // Primary Accents (The "Neural" aspect)
    cyan: {
      neon: '#00F0FF', // Primary Call-to-Action / Active State
      dim: 'rgba(0, 240, 255, 0.1)', // Hover states / Subtle backgrounds
      glow: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)', // Text Shadow / Box Shadow
    },
    // Secondary Accents (The "Academia" aspect)
    gold: {
      antique: '#C5A059', // Headers / Important highlights
      dim: 'rgba(197, 160, 89, 0.1)',
      border: '#C5A059',
    },
    // Status
    danger: '#FF2E2E',
    success: '#00FF41',
    warning: '#FFB800',
    
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1AA', // Muted silver
      tertiary: '#52525B', // Dark grey
    }
  },
  
  typography: {
    fontFamily: {
      sans: '"Inter", system-ui, sans-serif', // Logic / Data
      serif: '"Cinzel", serif', // Authority / Headings
      mono: '"JetBrains Mono", monospace', // Code / Technical Data
    },
    sizes: {
      h1: 'clamp(2.5rem, 5vw, 4rem)',
      h2: 'clamp(2rem, 4vw, 3rem)',
      h3: '1.5rem',
      body: '1rem',
      small: '0.875rem',
      tiny: '0.75rem',
    }
  },

  effects: {
    glass: {
      default: 'backdrop-filter: blur(12px); background: rgba(10, 10, 12, 0.7); border: 1px solid rgba(255, 255, 255, 0.08);',
      heavy: 'backdrop-filter: blur(20px); background: rgba(5, 5, 5, 0.9); border: 1px solid rgba(255, 255, 255, 0.1);',
      hover: 'backdrop-filter: blur(12px); background: rgba(20, 20, 25, 0.8); border: 1px solid rgba(0, 240, 255, 0.3);',
    },
    borders: {
      neon: '1px solid #00F0FF',
      gold: '1px solid #C5A059',
      subtle: '1px solid rgba(255, 255, 255, 0.1)',
    },
    shadows: {
      neon: '0 0 15px rgba(0, 240, 255, 0.2)',
      gold: '0 0 15px rgba(197, 160, 89, 0.2)',
    }
  },
  
  layout: {
    sidebarWidth: '280px',
    maxWidth: '1440px',
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '16px',
      full: '9999px',
    }
  }
};

// Helper for Tailwind config (mapping)
export const tailwindConfig = {
    colors: {
        'void': theme.colors.void.deep,
        'surface': theme.colors.void.surface,
        'neon-cyan': theme.colors.cyan.neon,
        'antique-gold': theme.colors.gold.antique,
    },
    extend: {
        fontFamily: {
            'cinzel': ['Cinzel', 'serif'],
            'inter': ['Inter', 'sans-serif'],
            'mono': ['JetBrains Mono', 'monospace'],
        },
        dropShadow: {
            'neon': '0 0 5px rgba(0, 240, 255, 0.5)',
            'gold': '0 0 5px rgba(197, 160, 89, 0.5)',
        }
    }
};
