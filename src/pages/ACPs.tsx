import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../components/StatusBar';
import { Footer } from '../components/Footer';
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Avalanche Community Proposals
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Browse and explore all ACPs in the Avalanche ecosystem
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total ACPs</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activated</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.byStatus['Activated'] || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Proposed</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.byStatus['Proposed'] || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">High Complexity</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.byComplexity['High'] || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 mb-8">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search ACPs by title, author, number, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                      ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                      ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
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

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      {stats && Object.keys(stats.byStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Track
                    </label>
                    <select
                      value={filters.track}
                      onChange={(e) => updateFilter('track', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                    >
                      <option value="">All Tracks</option>
                      {stats && Object.keys(stats.byTrack).map(track => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Complexity
                    </label>
                    <select
                      value={filters.complexity}
                      onChange={(e) => updateFilter('complexity', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                    >
                      <option value="">All Complexity</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Author
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by author..."
                      value={filters.author}
                      onChange={(e) => updateFilter('author', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.hasDiscussion === true}
                        onChange={(e) => updateFilter('hasDiscussion', e.target.checked ? true : null)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has Discussion</span>
                    </label>
                  </div>

                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {processedACPs.length} of {acps.length} ACPs
              </p>

              {(searchQuery || Object.values(filters).some(v => v !== '' && v !== null)) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Clear Search & Filters
                </button>
              )}
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

// ACP Card Component
interface ACPCardProps {
  acp: LocalACP;
  viewMode: ViewMode;
  onNavigate: (number: string) => void;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  getComplexityColor: (complexity: string) => string;
}

function ACPCard({ acp, viewMode, onNavigate, getStatusIcon, getStatusColor, getComplexityColor }: ACPCardProps) {
  if (viewMode === 'list') {
    return (
      <div
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 p-4 cursor-pointer"
        onClick={() => onNavigate(acp.number)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                ACP-{acp.number}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {acp.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(acp.status)}`}>
                  {getStatusIcon(acp.status)}
                  {acp.status}
                </div>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                  {acp.track}
                </span>
                {acp.complexity && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(acp.complexity)}`}>
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
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="bg-white dark:bg-dark-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 p-6 cursor-pointer"
      onClick={() => onNavigate(acp.number)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
            ACP-{acp.number}
          </span>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(acp.status)}`}>
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
            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {acp.title}
      </h3>

      {acp.abstract && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {acp.abstract}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
          {acp.track}
        </span>
        {acp.complexity && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(acp.complexity)}`}>
            {acp.complexity}
          </span>
        )}
        {acp.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">
            {acp.authors.slice(0, 2).map(author => author.name).join(', ')}
            {acp.authors.length > 2 && ` +${acp.authors.length - 2}`}
          </span>
        </div>

        {acp.readingTime && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-3 h-3" />
            {acp.readingTime} min
          </div>
        )}
      </div>
    </div>
  );
}