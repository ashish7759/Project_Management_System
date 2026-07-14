import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        width          : '40px',
        height         : '40px',
        borderRadius   : '10px',
        border         : '1px solid var(--border-default)',
        background     : 'var(--bg-surface-2)',
        color          : 'var(--color-accent)',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        cursor         : 'pointer',
        transition     : 'all 0.2s ease',
        flexShrink     : 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background
          = 'var(--bg-surface-hover)';
        (e.currentTarget as HTMLButtonElement).style.borderColor
          = 'var(--color-accent)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background
          = 'var(--bg-surface-2)';
        (e.currentTarget as HTMLButtonElement).style.borderColor
          = 'var(--border-default)';
      }}
    >
      {isDark
        ? <Sun  size={18} strokeWidth={1.8} />
        : <Moon size={18} strokeWidth={1.8} />
      }
    </button>
  );
};

export default ThemeToggle;
