/**
 * Modern Design System for LogicCanvas
 * Professional, clean UI with indigo/blue color palette
 */

// ==================== MODERN COLOR PALETTE ====================
export const modernColors = {
  // Primary - Indigo/Blue
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Secondary - Purple
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Accent - Cyan
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  
  // Success - Emerald
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Warning - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Danger - Rose
  danger: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  
  // Neutral - Slate
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

// ==================== MODERN COMPONENT STYLES ====================

/**
 * Modern Card Styles
 */
export const modernCardStyles = {
  base: 'bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200',
  hover: 'hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10',
  padding: 'p-6',
  header: 'font-semibold text-slate-900 text-lg mb-4',
};

/**
 * Modern Button Styles
 */
export const modernButtonStyles = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  secondary: 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  success: 'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  danger: 'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  ghost: 'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900',
  
  icon: 'inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900',
  
  small: 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
};

/**
 * Modern Input Styles
 */
export const modernInputStyles = {
  base: 'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
  error: 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20',
  success: 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20',
};

/**
 * Modern Badge Styles
 */
export const modernBadgeStyles = {
  draft: 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10',
  published: 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  pending: 'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20',
  completed: 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  approved: 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  rejected: 'inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20',
  paused: 'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20',
  archived: 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10',
  active: 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  inactive: 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10',
  error: 'inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20',
  in_progress: 'inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
  urgent: 'inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 animate-pulse',
  high: 'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20',
  medium: 'inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20',
  low: 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/10',
};

/**
 * Modern Search Bar Styles
 */
export const modernSearchBarStyles = {
  wrapper: 'relative flex-1',
  input: 'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
  icon: 'absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400',
};

/**
 * Modern Modal Styles
 */
export const modernModalStyles = {
  overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4',
  panel: 'relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col',
  header: 'bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between',
  headerTitle: 'text-lg font-semibold text-slate-900',
  headerSubtitle: 'text-sm text-slate-500 mt-0.5',
  content: 'flex-1 overflow-y-auto p-6',
  footer: 'border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3',
};

/**
 * Modern Toolbar Styles
 */
export const modernToolbarStyles = {
  container: 'bg-white border-b border-slate-200 px-6 py-4',
  section: 'flex items-center gap-2',
  divider: 'h-6 w-px bg-slate-300',
  group: 'flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200',
};

/**
 * Get modern badge style by status
 */
export const getModernBadgeStyle = (status) => {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
  return modernBadgeStyles[normalizedStatus] || modernBadgeStyles.pending;
};

export default {
  modernColors,
  modernCardStyles,
  modernButtonStyles,
  modernInputStyles,
  modernBadgeStyles,
  modernSearchBarStyles,
  modernModalStyles,
  modernToolbarStyles,
  getModernBadgeStyle,
};
