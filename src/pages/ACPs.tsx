import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../components/StatusBar';
import { Footer } from '../components/Footer';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { Spotlight } from '../components/ui/spotlight';
import {
  FileText,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Users,
  Tag,
  BookOpen,
  ChevronDown,
  Star,
  Archive
} from 'lucide-react';
import {
  getAllLocalACPs,
  getACPStats,
  searchACPs,
  filterACPs,
  sortACPs,
  LocalACP,
  ACPStats
} from '../data/acps';
import { getHealth } from '../api';
import { HealthStatus } from '../types';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

type ViewMode = 'grid' | 'list';
type SortOption = 'number' | 'title' | 'status' | 'complexity';
type SortOrder = 'asc' | 'desc';

interface Filters {
  status: string;
  track: string;
  complexity: string;
  author: string;
  hasDiscussion: boolean | null;
}

export function ACPs() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [acps, setAcps] = useState<LocalACP[]>([]);
  const [stats, setStats] = useState<ACPStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    status: '',
    track: '',
    complexity: '',
    author: '',
    hasDiscussion: null
  });

  useEffect(() => {
    async function loadACPs() {
      try {
        setLoading(true);
        setError(null);

        const [acpsData, statsData, healthData] = await Promise.all([
          getAllLocalACPs(),
          getACPStats(),
          getHealth()
        ]);

        setAcps(acpsData);
        setStats(statsData);
        setHealth(healthData);
      } catch (err) {
        console.error('Error loading ACPs:', err);
        setError('Failed to load ACPs from local files');
      } finally {
        setLoading(false);
      }
    }

    loadACPs();
  }, []);

  // Computed filtered and sorted ACPs
  const processedACPs = useMemo(() => {
    let result = acps;

    // Apply search
    if (searchQuery.trim()) {
      result = searchACPs(result, searchQuery);
    }

    // Apply filters
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '' && value !== null)
    );

    if (Object.keys(activeFilters).length > 0) {
      result = filterACPs(result, activeFilters);
    }

    // Apply sorting
    result = sortACPs(result, sortBy, sortOrder);

    return result;
  }, [acps, searchQuery, filters, sortBy, sortOrder]);

  const updateFilter = (key: keyof Filters, value: string | boolean | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      track: '',
      complexity: '',
      author: '',
      hasDiscussion: null
    });
    setSearchQuery('');
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('activated')) {
      return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />;
    }
    if (statusLower.includes('implementable')) {
      return <Star className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
    if (statusLower.includes('proposed') || statusLower.includes('draft')) {
      return <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
    }
    if (statusLower.includes('stale')) {
      return <Archive className="w-4 h-4 text-red-500 dark:text-red-400" />;
    }
    return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('activated')) {
      return 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
    if (statusLower.includes('implementable')) {
      return 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
    if (statusLower.includes('proposed') || statusLower.includes('draft')) {
      return 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    }
    if (statusLower.includes('stale')) {
      return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
    return 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  };

  const getComplexityColor = (complexity: string): string => {
    switch (complexity) {
      case 'High': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <StatusBar health={health} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading ACPs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <StatusBar health={health} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {error}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Make sure the git submodule is properly initialized and contains ACP files.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
      <StatusBar health={health} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header with Glassmorphic Design */}
          <div className="relative mb-8">
            <div className={cn(
              "relative rounded-2xl p-1",
              isDark
                ? "border-[0.5px] border-white/10"
                : "border-[0.5px] border-gray-900/10"
            )}>
              <GlowingEffect
                spread={60}
                glow={true}
                disabled={false}
                proximity={80}
                inactiveZone={0.1}
                borderWidth={2}
                movementDuration={1.5}
              />

              <div className={cn(
                "relative overflow-hidden rounded-xl shadow-2xl",
                isDark
                  ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                  : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
              )}>
                <div className="p-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className={cn(
                        "p-3 rounded-2xl backdrop-blur-sm shadow-lg",
                        isDark
                          ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20"
                          : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-gray-900/20"
                      )}>
                        <FileText className={cn(
                          "w-8 h-8",
                          isDark ? "text-blue-300" : "text-blue-600"
                        )} />
                      </div>
                    </div>

                    <h1 className={cn(
                      "text-4xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent",
                      isDark
                        ? "from-white to-white/70"
                        : "from-gray-900 to-gray-600"
                    )}>
                      Avalanche Community Proposals
                    </h1>

                    <p className={cn(
                      "text-lg max-w-2xl mx-auto",
                      isDark ? "text-white/70" : "text-gray-600"
                    )}>
                      Browse and explore all ACPs in the Avalanche ecosystem. Shape the future of the network through community-driven proposals.
                    </p>
                  </div>
                </div>

                {/* Gradient overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-xl",
                  isDark
                    ? "from-white/[0.02] via-transparent to-black/10"
                    : "from-gray-900/[0.02] via-transparent to-gray-900/10"
                )}></div>
              </div>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total ACPs Card */}
              <div className="relative h-full">
                <div className={cn(
                  "relative h-full rounded-xl p-1",
                  isDark
                    ? "border-[0.5px] border-white/10"
                    : "border-[0.5px] border-gray-900/10"
                )}>
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={60}
                    inactiveZone={0.1}
                    borderWidth={1.5}
                    movementDuration={1.2}
                  />

                  <div className={cn(
                    "relative h-full overflow-hidden rounded-lg shadow-xl p-6",
                    "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                    isDark
                      ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                      : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
                  )}>
                    <div className="flex items-center">
                      <div className={cn(
                        "flex-shrink-0 p-3 rounded-xl backdrop-blur-sm shadow-lg",
                        isDark
                          ? "bg-blue-500/20 border border-blue-400/30"
                          : "bg-blue-500/20 border border-blue-400/30"
                      )}>
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <p className={cn(
                          "text-sm font-medium",
                          isDark ? "text-white/60" : "text-gray-500"
                        )}>Total ACPs</p>
                        <p className={cn(
                          "text-3xl font-bold",
                          isDark ? "text-white" : "text-gray-900"
                        )}>{stats.total}</p>
                      </div>
                    </div>

                    {/* Subtle gradient overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg",
                      isDark
                        ? "from-white/[0.02] via-transparent to-blue/10"
                        : "from-gray-900/[0.02] via-transparent to-blue/10"
                    )}></div>
                  </div>
                </div>
              </div>

              {/* Activated Card */}
              <div className="relative h-full">
                <div className={cn(
                  "relative h-full rounded-xl p-1",
                  isDark
                    ? "border-[0.5px] border-white/10"
                    : "border-[0.5px] border-gray-900/10"
                )}>
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={60}
                    inactiveZone={0.1}
                    borderWidth={1.5}
                    movementDuration={1.2}
                  />

                  <div className={cn(
                    "relative h-full overflow-hidden rounded-lg shadow-xl p-6",
                    "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                    isDark
                      ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                      : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
                  )}>
                    <div className="flex items-center">
                      <div className={cn(
                        "flex-shrink-0 p-3 rounded-xl backdrop-blur-sm shadow-lg",
                        isDark
                          ? "bg-green-500/20 border border-green-400/30"
                          : "bg-green-500/20 border border-green-400/30"
                      )}>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="ml-4">
                        <p className={cn(
                          "text-sm font-medium",
                          isDark ? "text-white/60" : "text-gray-500"
                        )}>Activated</p>
                        <p className={cn(
                          "text-3xl font-bold",
                          isDark ? "text-white" : "text-gray-900"
                        )}>{stats.byStatus['Activated'] || 0}</p>
                      </div>
                    </div>

                    {/* Subtle gradient overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg",
                      isDark
                        ? "from-white/[0.02] via-transparent to-green/10"
                        : "from-gray-900/[0.02] via-transparent to-green/10"
                    )}></div>
                  </div>
                </div>
              </div>

              {/* Proposed Card */}
              <div className="relative h-full">
                <div className={cn(
                  "relative h-full rounded-xl p-1",
                  isDark
                    ? "border-[0.5px] border-white/10"
                    : "border-[0.5px] border-gray-900/10"
                )}>
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={60}
                    inactiveZone={0.1}
                    borderWidth={1.5}
                    movementDuration={1.2}
                  />

                  <div className={cn(
                    "relative h-full overflow-hidden rounded-lg shadow-xl p-6",
                    "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                    isDark
                      ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                      : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
                  )}>
                    <div className="flex items-center">
                      <div className={cn(
                        "flex-shrink-0 p-3 rounded-xl backdrop-blur-sm shadow-lg",
                        isDark
                          ? "bg-yellow-500/20 border border-yellow-400/30"
                          : "bg-yellow-500/20 border border-yellow-400/30"
                      )}>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div className="ml-4">
                        <p className={cn(
                          "text-sm font-medium",
                          isDark ? "text-white/60" : "text-gray-500"
                        )}>Proposed</p>
                        <p className={cn(
                          "text-3xl font-bold",
                          isDark ? "text-white" : "text-gray-900"
                        )}>{stats.byStatus['Proposed'] || 0}</p>
                      </div>
                    </div>

                    {/* Subtle gradient overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg",
                      isDark
                        ? "from-white/[0.02] via-transparent to-yellow/10"
                        : "from-gray-900/[0.02] via-transparent to-yellow/10"
                    )}></div>
                  </div>
                </div>
              </div>

              {/* High Complexity Card */}
              <div className="relative h-full">
                <div className={cn(
                  "relative h-full rounded-xl p-1",
                  isDark
                    ? "border-[0.5px] border-white/10"
                    : "border-[0.5px] border-gray-900/10"
                )}>
                  <GlowingEffect
                    spread={30}
                    glow={true}
                    disabled={false}
                    proximity={60}
                    inactiveZone={0.1}
                    borderWidth={1.5}
                    movementDuration={1.2}
                  />

                  <div className={cn(
                    "relative h-full overflow-hidden rounded-lg shadow-xl p-6",
                    "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                    isDark
                      ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                      : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
                  )}>
                    <div className="flex items-center">
                      <div className={cn(
                        "flex-shrink-0 p-3 rounded-xl backdrop-blur-sm shadow-lg",
                        isDark
                          ? "bg-purple-500/20 border border-purple-400/30"
                          : "bg-purple-500/20 border border-purple-400/30"
                      )}>
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                      </div>
                      <div className="ml-4">
                        <p className={cn(
                          "text-sm font-medium",
                          isDark ? "text-white/60" : "text-gray-500"
                        )}>High Complexity</p>
                        <p className={cn(
                          "text-3xl font-bold",
                          isDark ? "text-white" : "text-gray-900"
                        )}>{stats.byComplexity['High'] || 0}</p>
                      </div>
                    </div>

                    {/* Subtle gradient overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg",
                      isDark
                        ? "from-white/[0.02] via-transparent to-purple/10"
                        : "from-gray-900/[0.02] via-transparent to-purple/10"
                    )}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Search and Filters */}
          <div className="relative mb-8">
            <div className={cn(
              "relative rounded-xl p-1",
              isDark
                ? "border-[0.5px] border-white/10"
                : "border-[0.5px] border-gray-900/10"
            )}>
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={60}
                inactiveZone={0.1}
                borderWidth={1.5}
                movementDuration={1.2}
              />

              <div className={cn(
                "relative overflow-hidden rounded-lg shadow-xl",
                isDark
                  ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                  : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
              )}>
                <div className="p-6">
                  {/* Search Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-lg">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className={cn(
                          "h-5 w-5",
                          isDark ? "text-white/40" : "text-gray-400"
                        )} />
                      </div>
                      <input
                        type="text"
                        placeholder="Search ACPs by title, author, number, or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                          "block w-full pl-12 pr-4 py-3 rounded-xl text-sm",
                          "backdrop-blur-sm shadow-sm transition-all duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                          isDark
                            ? "bg-white/10 border border-white/20 text-white placeholder-white/50 hover:bg-white/15 focus:bg-white/15"
                            : "bg-gray-900/10 border border-gray-900/20 text-gray-900 placeholder-gray-500 hover:bg-gray-900/15 focus:bg-gray-900/15"
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Enhanced View Toggle */}
                      <div className={cn(
                        "flex backdrop-blur-sm rounded-xl p-1 shadow-sm",
                        isDark
                          ? "bg-white/10 border border-white/20"
                          : "bg-gray-900/10 border border-gray-900/20"
                      )}>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={cn(
                            "p-2.5 rounded-lg transition-all duration-200",
                            viewMode === 'grid'
                              ? isDark
                                ? 'bg-white/20 text-white shadow-lg border border-white/30'
                                : 'bg-gray-900/20 text-gray-900 shadow-lg border border-gray-900/30'
                              : isDark
                                ? 'text-white/60 hover:bg-white/10 hover:text-white/80'
                                : 'text-gray-600 hover:bg-gray-900/10 hover:text-gray-800'
                          )}
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={cn(
                            "p-2.5 rounded-lg transition-all duration-200",
                            viewMode === 'list'
                              ? isDark
                                ? 'bg-white/20 text-white shadow-lg border border-white/30'
                                : 'bg-gray-900/20 text-gray-900 shadow-lg border border-gray-900/30'
                              : isDark
                                ? 'text-white/60 hover:bg-white/10 hover:text-white/80'
                                : 'text-gray-600 hover:bg-gray-900/10 hover:text-gray-800'
                          )}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Enhanced Filter Toggle */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                          "inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium",
                          "backdrop-blur-sm shadow-sm transition-all duration-200",
                          isDark
                            ? "bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white"
                            : "bg-gray-900/10 border border-gray-900/20 text-gray-700 hover:bg-gray-900/15 hover:text-gray-900"
                        )}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        <ChevronDown className={cn(
                          "ml-2 w-4 h-4 transition-transform duration-200",
                          showFilters ? 'rotate-180' : ''
                        )} />
                      </button>

                      {/* Enhanced Sort */}
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                          setSortBy(newSortBy);
                          setSortOrder(newSortOrder);
                        }}
                        className={cn(
                          "rounded-xl px-4 py-2.5 text-sm font-medium",
                          "backdrop-blur-sm shadow-sm transition-all duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                          isDark
                            ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                            : "bg-gray-900/10 border border-gray-900/20 text-gray-900 hover:bg-gray-900/15"
                        )}
                      >
                        <option value="number-desc">Number (Newest First)</option>
                        <option value="number-asc">Number (Oldest First)</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                        <option value="status-asc">Status (A-Z)</option>
                        <option value="complexity-desc">Complexity (High to Low)</option>
                      </select>
                    </div>
                  </div>

                  {/* Enhanced Advanced Filters */}
                  {showFilters && (
                    <div className={cn(
                      "border-t pt-6 mt-6",
                      isDark ? "border-white/10" : "border-gray-900/10"
                    )}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2",
                            isDark ? "text-white/70" : "text-gray-700"
                          )}>
                            Status
                          </label>
                          <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className={cn(
                              "w-full rounded-lg px-3 py-2.5 text-sm backdrop-blur-sm shadow-sm",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                              isDark
                                ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                                : "bg-gray-900/10 border border-gray-900/20 text-gray-900 hover:bg-gray-900/15"
                            )}
                          >
                            <option value="">All Statuses</option>
                            {stats && Object.keys(stats.byStatus).map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2",
                            isDark ? "text-white/70" : "text-gray-700"
                          )}>
                            Track
                          </label>
                          <select
                            value={filters.track}
                            onChange={(e) => updateFilter('track', e.target.value)}
                            className={cn(
                              "w-full rounded-lg px-3 py-2.5 text-sm backdrop-blur-sm shadow-sm",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                              isDark
                                ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                                : "bg-gray-900/10 border border-gray-900/20 text-gray-900 hover:bg-gray-900/15"
                            )}
                          >
                            <option value="">All Tracks</option>
                            {stats && Object.keys(stats.byTrack).map(track => (
                              <option key={track} value={track}>{track}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2",
                            isDark ? "text-white/70" : "text-gray-700"
                          )}>
                            Complexity
                          </label>
                          <select
                            value={filters.complexity}
                            onChange={(e) => updateFilter('complexity', e.target.value)}
                            className={cn(
                              "w-full rounded-lg px-3 py-2.5 text-sm backdrop-blur-sm shadow-sm",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                              isDark
                                ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                                : "bg-gray-900/10 border border-gray-900/20 text-gray-900 hover:bg-gray-900/15"
                            )}
                          >
                            <option value="">All Complexity</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>

                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2",
                            isDark ? "text-white/70" : "text-gray-700"
                          )}>
                            Author
                          </label>
                          <input
                            type="text"
                            placeholder="Filter by author..."
                            value={filters.author}
                            onChange={(e) => updateFilter('author', e.target.value)}
                            className={cn(
                              "w-full rounded-lg px-3 py-2.5 text-sm backdrop-blur-sm shadow-sm",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                              isDark
                                ? "bg-white/10 border border-white/20 text-white placeholder-white/50 hover:bg-white/15"
                                : "bg-gray-900/10 border border-gray-900/20 text-gray-900 placeholder-gray-500 hover:bg-gray-900/15"
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-6">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.hasDiscussion === true}
                              onChange={(e) => updateFilter('hasDiscussion', e.target.checked ? true : null)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={cn(
                              "ml-2 text-sm",
                              isDark ? "text-white/70" : "text-gray-700"
                            )}>Has Discussion</span>
                          </label>
                        </div>

                        <button
                          onClick={clearFilters}
                          className={cn(
                            "text-sm font-medium transition-colors duration-200",
                            isDark
                              ? "text-blue-400 hover:text-blue-300"
                              : "text-blue-600 hover:text-blue-800"
                          )}
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Results Count */}
                  <div className={cn(
                    "flex justify-between items-center mt-6 pt-6 border-t",
                    isDark ? "border-white/10" : "border-gray-900/10"
                  )}>
                    <p className={cn(
                      "text-sm",
                      isDark ? "text-white/60" : "text-gray-600"
                    )}>
                      Showing <span className="font-semibold">{processedACPs.length}</span> of <span className="font-semibold">{acps.length}</span> ACPs
                    </p>

                    {(searchQuery || Object.values(filters).some(v => v !== '' && v !== null)) && (
                      <button
                        onClick={clearFilters}
                        className={cn(
                          "text-sm font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200",
                          isDark
                            ? "text-blue-400 hover:text-blue-300 hover:bg-white/5"
                            : "text-blue-600 hover:text-blue-800 hover:bg-gray-900/5"
                        )}
                      >
                        Clear Search & Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Gradient overlay */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg",
                  isDark
                    ? "from-white/[0.02] via-transparent to-black/10"
                    : "from-gray-900/[0.02] via-transparent to-gray-900/10"
                )}></div>
              </div>
            </div>
          </div>

          {/* Results */}
          {processedACPs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No ACPs found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {processedACPs.map(acp => (
                <ACPCard
                  key={acp.number}
                  acp={acp}
                  viewMode={viewMode}
                  onNavigate={(number) => navigate(`/acps/${number}`)}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getComplexityColor={getComplexityColor}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}


// Add this helper function before the ACPCard component
const getSpotlightColorByStatus = (status: string): string => {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('activated')) {
    return 'from-green-500/25 via-green-400/15 to-green-300/10 dark:from-green-400/25 dark:via-green-300/15 dark:to-green-200/10';
  }
  if (statusLower.includes('implementable')) {
    return 'from-blue-500/25 via-blue-400/15 to-blue-300/10 dark:from-blue-400/25 dark:via-blue-300/15 dark:to-blue-200/10';
  }
  if (statusLower.includes('proposed') || statusLower.includes('draft')) {
    return 'from-yellow-500/25 via-yellow-400/15 to-yellow-300/10 dark:from-yellow-400/25 dark:via-yellow-300/15 dark:to-yellow-200/10';
  }
  if (statusLower.includes('stale')) {
    return 'from-red-500/25 via-red-400/15 to-red-300/10 dark:from-red-400/25 dark:via-red-300/15 dark:to-red-200/10';
  }

  // Default blue
  return 'from-blue-500/20 via-blue-400/15 to-blue-300/10 dark:from-blue-400/20 dark:via-blue-300/15 dark:to-blue-200/10';
};

// Complete ACPCard Component (replace the existing one)
interface ACPCardProps {
  acp: LocalACP;
  viewMode: ViewMode;
  onNavigate: (number: string) => void;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  getComplexityColor: (complexity: string) => string;
}

function ACPCard({ acp, viewMode, onNavigate, getStatusIcon, getStatusColor, getComplexityColor }: ACPCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const spotlightColor = getSpotlightColorByStatus(acp.status);

  if (viewMode === 'list') {
    return (
      <div
        className="relative bg-white dark:bg-dark-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 p-4 cursor-pointer overflow-hidden group"
        onClick={() => onNavigate(acp.number)}
      >
        {/* Spotlight Effect */}
        <Spotlight
          className={spotlightColor}
          size={200}
          springOptions={{ bounce: 0.15, damping: 20 }}
        />

        {/* Subtle background gradient that appears on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <span className="text-sm font-mono text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                ACP-{acp.number}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                {acp.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 group-hover:scale-105 ${getStatusColor(acp.status)}`}>
                  {getStatusIcon(acp.status)}
                  {acp.status}
                </div>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium transition-all duration-200 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                  {acp.track}
                </span>
                {acp.complexity && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 group-hover:scale-105 ${getComplexityColor(acp.complexity)}`}>
                    {acp.complexity}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {acp.authors.slice(0, 2).map(author => author.name).join(', ')}
                {acp.authors.length > 2 && ` +${acp.authors.length - 2} more`}
              </div>
              {acp.readingTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {acp.readingTime} min read
                </div>
              )}
            </div>

            {acp.discussion && (
              <a
                href={acp.discussion}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view with all existing features preserved
  return (
    <div className="relative h-full min-h-[280px]">
      {/* Outer container with theme-aware glowing effect */}
      <div className={cn(
        "relative h-full rounded-xl p-1",
        isDark
          ? "border-[0.5px] border-white/10"
          : "border-[0.5px] border-gray-900/10"
      )}>
        <GlowingEffect
          spread={45}
          glow={true}
          disabled={false}
          proximity={60}
          inactiveZone={0.1}
          borderWidth={2}
          movementDuration={1.2}
        />

        {/* Glassmorphic inner card - theme aware */}
        <div
          className={cn(
            "relative h-full cursor-pointer overflow-hidden rounded-lg",
            "shadow-2xl transition-all duration-300 hover:shadow-xl",
            "transform hover:-translate-y-0.5 hover:scale-[1.02] group",
            isDark ? [
              "bg-white/5 backdrop-blur-xl",
              "border border-white/10",
              "shadow-black/10 hover:bg-white/10"
            ] : [
              "bg-gray-900/5 backdrop-blur-xl",
              "border border-gray-900/10",
              "shadow-gray-900/10 hover:bg-gray-900/10"
            ]
          )}
          onClick={() => onNavigate(acp.number)}
        >
          {/* Spotlight Effect */}
          <Spotlight
            className={spotlightColor}
            size={220}
            springOptions={{ bounce: 0.15, damping: 20 }}
          />

          <div className="relative z-10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-mono px-2.5 py-1 rounded-md backdrop-blur-sm shadow-sm transition-colors",
                  isDark
                    ? "text-white/70 bg-white/10 border border-white/20 group-hover:text-white/90 group-hover:bg-white/15"
                    : "text-gray-600 bg-gray-900/10 border border-gray-900/20 group-hover:text-gray-800 group-hover:bg-gray-900/15"
                )}>
                  ACP-{acp.number}
                </span>
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 group-hover:scale-105 ${getStatusColor(acp.status)}`}>
                  {getStatusIcon(acp.status)}
                  {acp.status}
                </div>
              </div>

              {acp.discussion && (
                <a
                  href={acp.discussion}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "p-2 rounded-lg backdrop-blur-sm transition-all duration-200 shadow-sm",
                    isDark
                      ? "text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/15 border border-white/10"
                      : "text-gray-500 hover:text-gray-800 bg-gray-900/5 hover:bg-gray-900/15 border border-gray-900/10"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <h3 className={cn(
              "text-lg font-semibold mb-3 line-clamp-2 transition-colors",
              isDark
                ? "text-white group-hover:text-blue-100"
                : "text-gray-900 group-hover:text-blue-900"
            )}>
              {acp.title}
            </h3>

            {acp.abstract && (
              <p className={cn(
                "text-sm mb-4 line-clamp-3 leading-relaxed transition-colors",
                isDark
                  ? "text-white/70 group-hover:text-white/80"
                  : "text-gray-600 group-hover:text-gray-700"
              )}>
                {acp.abstract}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm shadow-sm transition-all duration-200",
                isDark
                  ? "bg-white/10 text-white/70 border border-white/20 group-hover:bg-white/15 group-hover:text-white/80"
                  : "bg-gray-900/10 text-gray-700 border border-gray-900/20 group-hover:bg-gray-900/15 group-hover:text-gray-800"
              )}>
                {acp.track}
              </span>
              {acp.complexity && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm transition-all duration-200 group-hover:scale-105 ${getComplexityColor(acp.complexity)}`}>
                  {acp.complexity}
                </span>
              )}
              {acp.tags?.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium shadow-sm transition-all duration-200 group-hover:scale-105",
                    isDark
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30 group-hover:bg-blue-500/30"
                      : "bg-blue-500/10 text-blue-600 border border-blue-400/30 group-hover:bg-blue-500/20"
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-md backdrop-blur-sm shadow-sm transition-colors",
                  isDark
                    ? "bg-white/10 border border-white/20 group-hover:bg-white/15"
                    : "bg-gray-900/10 border border-gray-900/20 group-hover:bg-gray-900/15"
                )}>
                  <Users className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isDark
                      ? "text-white/60 group-hover:text-white/70"
                      : "text-gray-600 group-hover:text-gray-700"
                  )} />
                </div>
                <span className={cn(
                  "transition-colors",
                  isDark
                    ? "text-white/70 group-hover:text-white/80"
                    : "text-gray-600 group-hover:text-gray-700"
                )}>
                  {acp.authors.slice(0, 2).map(author => author.name).join(', ')}
                  {acp.authors.length > 2 && ` +${acp.authors.length - 2}`}
                </span>
              </div>

              {acp.readingTime && (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-md backdrop-blur-sm shadow-sm transition-colors",
                    isDark
                      ? "bg-white/10 border border-white/20 group-hover:bg-white/15"
                      : "bg-gray-900/10 border border-gray-900/20 group-hover:bg-gray-900/15"
                  )}>
                    <BookOpen className={cn(
                      "w-3.5 h-3.5 transition-colors",
                      isDark
                        ? "text-white/60 group-hover:text-white/70"
                        : "text-gray-600 group-hover:text-gray-700"
                    )} />
                  </div>
                  <span className={cn(
                    "text-xs transition-colors",
                    isDark
                      ? "text-white/60 group-hover:text-white/70"
                      : "text-gray-500 group-hover:text-gray-600"
                  )}>
                    {acp.readingTime} min
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Subtle gradient overlay for depth - theme aware */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg transition-opacity duration-300",
            isDark
              ? "from-white/[0.02] via-transparent to-black/10 group-hover:from-white/[0.04]"
              : "from-gray-900/[0.02] via-transparent to-gray-900/10 group-hover:from-gray-900/[0.04]"
          )}></div>

          {/* Hover glow effect - theme aware */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg bg-gradient-to-br pointer-events-none",
            isDark
              ? "from-white/5 via-transparent to-transparent"
              : "from-gray-900/5 via-transparent to-transparent"
          )}></div>
        </div>
      </div>
    </div>
  );
}