/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Main backgrounds - Professional dark theme
        bg: {
          primary: '#09090b', // Deepest black/gray
          secondary: '#0c0c0e',
          sidebar: '#111113', // Very dark slate
          elevated: '#18181b', // Elevated cards/modals
          hover: '#27272a',
        },
        // Borders
        border: {
          DEFAULT: '#27272a',
          subtle: '#18181b',
          strong: '#3f3f46',
        },
        // Text
        text: {
          primary: '#fafafa', // Pure white text
          secondary: '#a1a1aa', // Muted text
          muted: '#71717a', // Very muted
          accent: '#ffffff',
        },
        // Accent - Professional monochrome/subtle blue instead of WhatsApp green
        accent: {
          DEFAULT: '#3b82f6', // Clean, professional blue
          dark: '#2563eb',
          light: '#60a5fa',
          subtle: '#1d4ed820', // Blue with opacity
        },
        // Message bubbles
        bubble: {
          sent: '#18181b', // Dark gray for sent
          sentHover: '#27272a',
          received: '#09090b', // Black for received
          receivedHover: '#18181b',
        },
        // Status colors
        online: '#10b981', // Emerald for online
        offline: '#71717a',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        md: ['15px', '22px'],
        lg: ['16px', '24px'],
        xl: ['18px', '28px'],
        '2xl': ['20px', '32px'],
        '3xl': ['24px', '36px'],
        '4xl': ['30px', '40px'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(255, 255, 255, 0.05)',
        'glow-accent-sm': '0 0 10px rgba(255, 255, 255, 0.02)',
        card: '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-lg': '0 8px 48px rgba(0, 0, 0, 0.8)',
        elevated: '0 2px 8px rgba(0, 0, 0, 0.4)',
        menu: '0 8px 32px rgba(0, 0, 0, 0.6)',
        modal: '0 24px 64px rgba(0, 0, 0, 0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-out-down': 'slideOutDown 0.2s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        typing: 'typing 1.4s ease-in-out infinite',
        ripple: 'ripple 0.6s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        'message-in': 'messageIn 0.25s ease-out',
        'notification-bounce': 'notificationBounce 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: 0, transform: 'translateX(-20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideOutDown: {
          '0%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(20px)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        typing: {
          '0%, 100%': { opacity: 0.3, transform: 'translateY(0)' },
          '50%': { opacity: 1, transform: 'translateY(-4px)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: 1 },
          '100%': { transform: 'scale(4)', opacity: 0 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        messageIn: {
          '0%': { opacity: 0, transform: 'scale(0.95) translateY(8px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        notificationBounce: {
          '0%': { transform: 'scale(0.5)', opacity: 0 },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        sidebar: '320px',
        'chat-header': '64px',
        'message-input': '72px',
      },
      zIndex: {
        overlay: 40,
        modal: 50,
        toast: 60,
        tooltip: 70,
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [],
};
