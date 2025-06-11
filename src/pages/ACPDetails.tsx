import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Footer } from '../components/Footer';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Star,
  Archive,
  Users,
  BookOpen,
  Tag,
  GitBranch,
  Link as LinkIcon
} from 'lucide-react';
import { getACPByNumber, LocalACP } from '../data/acps';

export function ACPDetails() {
  const { number } = useParams();
  const navigate = useNavigate();
  const [acp, setAcp] = useState<LocalACP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchACP() {
      try {
        setLoading(true);
        setError(null);

        if (!number) {
          throw new Error('No ACP number provided');
        }

        const acpData = await getACPByNumber(number);

        if (!acpData) {
          throw new Error(`ACP-${number} not found`);
        }

        setAcp(acpData);
      } catch (err) {
        console.error('Error fetching ACP:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ACP details');
      } finally {
        setLoading(false);
      }
    }

    if (number) {
      fetchACP();
    }
  }, [number]);

  function getStatusColor(status: string): string {
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
  }

  function getStatusIcon(status: string) {
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
  }

  function getComplexityColor(complexity: string): string {
    switch (complexity) {
      case 'High': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading ACP details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !acp) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {error || 'ACP not found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error?.includes('not found')
                ? `ACP-${number} could not be found in the local files.`
                : 'There was an error loading the ACP details.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/acps')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to ACPs
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/acps')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to ACPs
            </button>
            <ThemeToggle />
          </div>

          {/* ACP Header */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              {/* Title and Number */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-mono text-gray-500 dark:text-gray-400">
                      ACP-{acp.number}
                    </span>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(acp.status)}`}>
                      {getStatusIcon(acp.status)}
                      {acp.status}
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {acp.title}
                  </h1>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Track */}
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Track:</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                    {acp.track}
                  </span>
                </div>

                {/* Complexity */}
                {acp.complexity && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Complexity:</span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getComplexityColor(acp.complexity)}`}>
                      {acp.complexity}
                    </span>
                  </div>
                )}

                {/* Reading Time */}
                {acp.readingTime && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reading time:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {acp.readingTime} min
                    </span>
                  </div>
                )}
              </div>

              {/* Authors */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Authors:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {acp.authors.map((author, index) => (
                    <a
                      key={index}
                      href={`https://github.com/${author.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      {author.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {acp.tags && acp.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {acp.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies and Relationships */}
              {(acp.dependencies?.length || acp.replaces?.length || acp.supersededBy?.length) && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Relationships:</span>
                  </div>
                  <div className="space-y-2">
                    {acp.dependencies && acp.dependencies.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20">Depends on:</span>
                        <div className="flex gap-1">
                          {acp.dependencies.map(dep => (
                            <button
                              key={dep}
                              onClick={() => navigate(`/acps/${dep}`)}
                              className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded text-xs font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                            >
                              ACP-{dep}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {acp.replaces && acp.replaces.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20">Replaces:</span>
                        <div className="flex gap-1">
                          {acp.replaces.map(rep => (
                            <button
                              key={rep}
                              onClick={() => navigate(`/acps/${rep}`)}
                              className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              ACP-{rep}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {acp.supersededBy && acp.supersededBy.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-20">Superseded by:</span>
                        <div className="flex gap-1">
                          {acp.supersededBy.map(sup => (
                            <button
                              key={sup}
                              onClick={() => navigate(`/acps/${sup}`)}
                              className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                              ACP-{sup}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {acp.discussion && (
                  <a
                    href={acp.discussion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    View Discussion
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}

                <a
                  href={`https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/${acp.folderName || acp.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View on GitHub
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* ACP Content */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <MarkdownRenderer
                content={acp.content}
                className="prose-lg"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}