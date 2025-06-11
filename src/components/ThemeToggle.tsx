import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  // Update body class to reflect current theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const handleClick = () => {
    setIsAnimating(true);

    // Calculate the opposite theme
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // Update React state first
    toggleTheme();

    // Immediately update DOM classes for instant visual feedback
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    document.body.setAttribute('data-theme', newTheme);

    // Force page reload to ensure all text elements update properly
    // This is the most reliable way to handle D3, Chart.js, and other non-React text elements
    setTimeout(() => {
      window.location.reload();
    }, 100); // Small delay to allow the theme toggle animation to start
  };

  return (
    <button
      onClick={handleClick}
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun
          className={`w-5 h-5 text-yellow-400 ${isAnimating ? 'theme-icon-enter' : ''}`}
        />
      ) : (
        <Moon
          className={`w-5 h-5 text-indigo-500 ${isAnimating ? 'theme-icon-enter' : ''}`}
        />
      )}
    </button>
  );
}