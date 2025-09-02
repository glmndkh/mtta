
// Design System Tokens

export const colors = {
  primary: {
    main: '#16a34a', // green-600
    hover: '#15803d', // green-700
    light: '#22c55e', // green-500
    dark: '#166534', // green-800
  },
  neutral: {
    900: '#111827', // gray-900
    700: '#374151', // gray-700
    500: '#6b7280', // gray-500
    300: '#d1d5db', // gray-300
    100: '#f3f4f6', // gray-100
  },
  danger: '#dc2626', // red-600
  info: '#2563eb', // blue-600
  live: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  success: '#16a34a', // green-600
};

export const typography = {
  fontFamily: {
    body: ['Inter', 'system-ui', 'sans-serif'],
    heading: ['Oswald', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
};

export const spacing = {
  // 8px grid system
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  full: '9999px',   // chips/pills
};

export const shadows = {
  subtle: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // shadow-md
  elevated: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
  dramatic: '0 25px 50px -12px rgb(0 0 0 / 0.25)', // shadow-2xl
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  dropdown: 50,
  overlay: 40,
  modal: 60,
  tooltip: 70,
  toast: 80,
};

// Animation durations
export const animation = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  extraSlow: '500ms',
};

// Component-specific tokens
export const components = {
  card: {
    borderRadius: borderRadius.lg,
    shadow: shadows.subtle,
    hoverShadow: shadows.elevated,
  },
  chip: {
    borderRadius: borderRadius.full,
    padding: `${spacing[1]} ${spacing[3]}`,
  },
  button: {
    borderRadius: borderRadius.md,
    padding: `${spacing[2]} ${spacing[4]}`,
    focusRing: '2px',
  },
};

// Micro-interaction states
export const states = {
  hover: {
    transform: 'translateY(-2px)',
    shadow: shadows.elevated,
  },
  pressed: {
    transform: 'translateY(0)',
    shadow: shadows.subtle,
  },
  focus: {
    ring: `2px solid ${colors.primary.main}`,
    ringOffset: '2px',
  },
};

// Live elements
export const live = {
  pulse: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    // Respects prefers-reduced-motion
    reducedMotion: 'none',
  },
  badge: {
    backgroundColor: colors.live,
    animation: 'pulse 2s ease-in-out infinite',
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animation,
  components,
  states,
  live,
};
