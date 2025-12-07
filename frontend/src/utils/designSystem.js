/**
 * LogicCanvas Design System
 * Centralized design tokens and utility classes for consistent UI across the application
 */

// ==================== COLOR PALETTE ====================
export const colors = {
  // Primary Brand Colors (Green)
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Status Colors
  status: {
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#22c55e',
    pending: '#eab308',
  },
  
  // Neutral Colors
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

// ==================== SPACING SCALE ====================
export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// ==================== BORDER RADIUS ====================
export const borderRadius = {
  sm: '0.375rem',   // 6px - rounded-md
  md: '0.5rem',     // 8px - rounded-lg
  lg: '0.75rem',    // 12px - rounded-xl
  xl: '1rem',       // 16px - rounded-2xl
  full: '9999px',   // rounded-full
};

// ==================== SHADOWS ====================
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

// ==================== COMPONENT STYLES ====================

/**
 * Modal/Panel Header Styles
 * Consistent gradient header for all modals and panels
 */
export const modalHeaderStyles = {
  base: 'bg-gradient-to-r from-green-600 to-green-600 text-white px-6 py-5 shadow-xl',
  title: 'text-2xl font-bold',
  subtitle: 'text-green-100 text-sm mt-1',
  closeButton: 'p-2 hover:bg-white/20 rounded-lg transition-all hover:shadow-lg',
};

/**
 * Card Styles
 * Consistent card design across the application
 */
export const cardStyles = {
  base: 'bg-white rounded-xl border-2 border-slate-200 shadow-lg transition-all',
  hover: 'hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/10',
  padding: 'p-6',
  header: 'font-semibold text-slate-900 text-lg mb-4',
};

/**
 * Button Styles
 * Standardized button variants
 */
export const buttonStyles = {
  primary: 'inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed',
  
  secondary: 'inline-flex items-center justify-center space-x-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
  
  success: 'inline-flex items-center justify-center space-x-2 rounded-xl bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
  
  danger: 'inline-flex items-center justify-center space-x-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
  
  ghost: 'inline-flex items-center justify-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900',
  
  small: 'inline-flex items-center justify-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
};

/**
 * Input Styles
 * Consistent form input styling
 */
export const inputStyles = {
  base: 'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20',
  error: 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
  success: 'border-green-300 focus:border-green-500 focus:ring-green-500/20',
};

/**
 * Badge/Status Styles
 * Consistent badge design for status indicators
 */
export const badgeStyles = {
  draft: 'inline-flex items-center space-x-1 rounded-full border-2 border-yellow-300 bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800',
  published: 'inline-flex items-center space-x-1 rounded-full border-2 border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800',
  pending: 'inline-flex items-center space-x-1 rounded-full border-2 border-yellow-300 bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800',
  completed: 'inline-flex items-center space-x-1 rounded-full border-2 border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800',
  approved: 'inline-flex items-center space-x-1 rounded-full border-2 border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800',
  rejected: 'inline-flex items-center space-x-1 rounded-full border-2 border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800',
  paused: 'inline-flex items-center space-x-1 rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800',
  archived: 'inline-flex items-center space-x-1 rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800',
  active: 'inline-flex items-center space-x-1 rounded-full border-2 border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800',
  inactive: 'inline-flex items-center space-x-1 rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800',
  error: 'inline-flex items-center space-x-1 rounded-full border-2 border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800',
  in_progress: 'inline-flex items-center space-x-1 rounded-full border-2 border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800',
  urgent: 'inline-flex items-center space-x-1 rounded-full border-2 border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 animate-pulse',
  high: 'inline-flex items-center space-x-1 rounded-full border-2 border-gold-300 bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-800',
  medium: 'inline-flex items-center space-x-1 rounded-full border-2 border-green-300 bg-green-100 px-3 py-1 text-xs font-semibold text-green-800',
  low: 'inline-flex items-center space-x-1 rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800',
};

/**
 * Stats Card Styles
 * For metric/stat display cards
 */
export const statsCardStyles = {
  base: 'rounded-xl border-2 border-slate-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl',
  value: 'text-3xl font-bold text-slate-900',
  label: 'text-sm font-medium text-slate-600 mb-2',
  change: 'text-sm text-slate-500 mt-1',
};

/**
 * Modal Overlay Styles
 */
export const modalOverlayStyles = {
  base: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4',
  panel: 'relative w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in',
};

/**
 * Sidebar Styles
 */
export const sidebarStyles = {
  base: 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl',
  item: 'flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
  itemActive: 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20',
  itemInactive: 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
  divider: 'border-t border-slate-700',
};

/**
 * Table Styles
 */
export const tableStyles = {
  wrapper: 'bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-lg',
  header: 'bg-slate-50 border-b-2 border-slate-200',
  headerCell: 'px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider',
  row: 'border-b border-slate-200 hover:bg-slate-50 transition-colors',
  cell: 'px-6 py-4 text-sm text-slate-900',
};

/**
 * Search Bar Styles
 */
export const searchBarStyles = {
  wrapper: 'relative flex-1',
  input: 'w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20',
  icon: 'absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400',
};

/**
 * Empty State Styles (already well-designed, keeping it)
 */
export const emptyStateStyles = {
  container: 'flex flex-col items-center justify-center p-12 text-center',
  iconWrapper: 'relative mb-6',
  icon: 'w-16 h-16 text-slate-400',
  title: 'mb-3 text-2xl font-bold text-slate-900',
  description: 'mb-6 max-w-md text-base text-slate-600 leading-relaxed',
};

/**
 * Toast/Notification Styles
 */
export const toastStyles = {
  base: 'rounded-xl shadow-xl border-2 px-6 py-4 flex items-center space-x-3 animate-slide-in',
  success: 'bg-green-50 border-green-300 text-green-900',
  error: 'bg-red-50 border-red-300 text-red-900',
  warning: 'bg-gold-50 border-gold-300 text-gold-900',
  info: 'bg-green-50 border-green-300 text-green-900',
};

/**
 * Utility function to combine class names
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get badge style by status
 */
export const getBadgeStyle = (status) => {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_');
  return badgeStyles[normalizedStatus] || badgeStyles.pending;
};

/**
 * Priority Colors
 */
export const priorityColors = {
  low: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  medium: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  high: { bg: 'bg-gold-100', text: 'text-gold-700', border: 'border-gold-300' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  modalHeaderStyles,
  cardStyles,
  buttonStyles,
  inputStyles,
  badgeStyles,
  statsCardStyles,
  modalOverlayStyles,
  sidebarStyles,
  tableStyles,
  searchBarStyles,
  emptyStateStyles,
  toastStyles,
  cn,
  getBadgeStyle,
  priorityColors,
};
