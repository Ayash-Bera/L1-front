import { CheckCircle, XCircle, AlertTriangle, Menu, X, ExternalLink } from 'lucide-react';
import { HealthStatus } from '../types';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

interface StatusBarProps {
  health: HealthStatus | null;
}

export function StatusBar({ health }: StatusBarProps) {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<'blog' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const handleLogoClick = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  const isHealthy = health?.status.toLowerCase() === 'ok' || health?.status.toLowerCase() === 'healthy';
  const isACPPage = location.pathname.startsWith('/acps');

  return (
    <div className={`sticky top-0 z-50 transform transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
      {/* Alpha Warning Banner - theme aware */}
      <div className={cn(
        "border-b",
        isDark
          ? "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-900/30"
          : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className={cn(
              "w-4 h-4",
              isDark ? "text-amber-600 dark:text-amber-400" : "text-amber-600"
            )} />
            <p className={cn(
              "text-sm font-medium",
              isDark ? "text-amber-800 dark:text-amber-200" : "text-amber-800"
            )}>
              L1Beat is currently in alpha. Data shown may be incomplete or inaccurate.
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation with enhanced theme support */}
      <div className={cn(
        "backdrop-blur-lg border-b shadow-sm",
        isDark
          ? "bg-white/90 dark:bg-black/90 border-gray-200 dark:border-gray-800 dark:shadow-lg"
          : "bg-white/95 border-gray-200"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Health Status */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                onClick={handleLogoClick}
                className="relative transform transition-all duration-300 hover:scale-105 focus:outline-none group"
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-lg filter blur-xl transition-opacity duration-500",
                    isDark
                      ? "bg-red-500/20 dark:bg-red-500/40"
                      : "bg-red-500/15",
                    isAnimating ? 'animate-heartbeat-glow' : 'opacity-0'
                  )}
                />
                <img
                  src="https://raw.githubusercontent.com/muhammetselimfe/L1Beat/refs/heads/main/public/l1_logo_main_2.png"
                  alt="L1Beat"
                  className={cn(
                    "h-8 w-auto relative transition-transform duration-300",
                    isAnimating && 'animate-heartbeat'
                  )}
                />
              </Link>

              {health && (
                <div className={cn(
                  "hidden md:flex items-center gap-2 pl-6 border-l",
                  isDark ? "border-gray-200 dark:border-gray-700" : "border-gray-200"
                )}>
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    isHealthy
                      ? isDark
                        ? 'bg-green-100 dark:bg-green-500/20'
                        : 'bg-green-100'
                      : isDark
                        ? 'bg-red-100 dark:bg-red-500/20'
                        : 'bg-red-100'
                  )}>
                    {isHealthy ? (
                      <CheckCircle className={cn(
                        "w-4 h-4",
                        isDark ? "text-green-600 dark:text-green-400" : "text-green-600"
                      )} />
                    ) : (
                      <XCircle className={cn(
                        "w-4 h-4",
                        isDark ? "text-red-600 dark:text-red-400" : "text-red-600"
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isHealthy
                      ? isDark
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-green-700'
                      : isDark
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-red-700'
                  )}>
                    {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowTooltip('blog')}
                  onMouseLeave={() => setShowTooltip(null)}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors",
                    isDark
                      ? "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                      : "text-gray-700 hover:text-blue-600"
                  )}
                >
                  Blog
                  {showTooltip === 'blog' && (
                    <div className={cn(
                      "absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded",
                      isDark ? "bg-gray-900 dark:bg-gray-700 text-white" : "bg-gray-900 text-white"
                    )}>
                      Coming soon
                    </div>
                  )}
                </button>

                <a
                  href="https://docs.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
                    isDark
                      ? "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                      : "text-gray-700 hover:text-blue-600"
                  )}
                >
                  Docs
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Link
                  to="/acps"
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 shadow-sm",
                    isACPPage
                      ? "text-white bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg"
                      : "text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-glow"
                  )}
                >
                  ACPs
                </Link>
              </div>

              <div className={cn(
                "h-6 w-px",
                isDark ? "bg-gray-200 dark:bg-gray-700" : "bg-gray-200"
              )}></div>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  "inline-flex items-center justify-center p-2 rounded-md focus:outline-none",
                  isDark
                    ? "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu with enhanced theme support */}
          <div className={cn(
            "md:hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          )}>
            <div className="py-3 space-y-3">
              {health && (
                <div className={cn(
                  "px-4 py-3 rounded-lg",
                  isDark ? "bg-gray-50 dark:bg-gray-900/50" : "bg-gray-50"
                )}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      isHealthy
                        ? isDark
                          ? 'bg-green-100 dark:bg-green-500/20'
                          : 'bg-green-100'
                        : isDark
                          ? 'bg-red-100 dark:bg-red-500/20'
                          : 'bg-red-100'
                    )}>
                      {isHealthy ? (
                        <CheckCircle className={cn(
                          "w-4 h-4",
                          isDark ? "text-green-600 dark:text-green-400" : "text-green-600"
                        )} />
                      ) : (
                        <XCircle className={cn(
                          "w-4 h-4",
                          isDark ? "text-red-600 dark:text-red-400" : "text-red-600"
                        )} />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isHealthy
                        ? isDark
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-green-700'
                        : isDark
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-red-700'
                    )}>
                      {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowTooltip('blog');
                    setTimeout(() => setShowTooltip(null), 2000);
                  }}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between text-sm font-medium rounded-lg transition-colors",
                    isDark
                      ? "text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <span>Blog</span>
                  {showTooltip === 'blog' && (
                    <span className={cn(
                      "text-xs",
                      isDark ? "text-blue-500 dark:text-blue-400" : "text-blue-500"
                    )}>Coming soon</span>
                  )}
                </button>

                <a
                  href="https://docs.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between text-sm font-medium rounded-lg transition-colors",
                    isDark
                      ? "text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <span>Docs</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <Link
                  to="/acps"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between text-sm font-medium rounded-lg transition-colors",
                    isACPPage
                      ? isDark
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                        : "text-blue-600 bg-blue-50"
                      : isDark
                        ? "text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <span>ACPs</span>
                  {isACPPage && (
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isDark ? "bg-blue-500 dark:bg-blue-400" : "bg-blue-500"
                    )} />
                  )}
                </Link>
              </div>

              <div className={cn(
                "px-4 pt-4 border-t",
                isDark ? "border-gray-200 dark:border-gray-700" : "border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-medium",
                    isDark ? "text-gray-700 dark:text-gray-200" : "text-gray-700"
                  )}>Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}