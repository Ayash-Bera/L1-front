import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getChains, getTPSHistory } from '../api';
import { Chain, TPSHistory } from '../types';
import { Activity, ArrowLeft, Server, Clock, Search, CheckCircle, XCircle, Info, Copy, Check } from 'lucide-react';
import { StakeDistributionChart, getValidatorColor } from '../components/StakeDistributionChart';
import { TPSChart } from '../components/TPSChart';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { useTheme } from '../hooks/useTheme';

export function ChainDetails() {
  const { chainId } = useParams();
  const navigate = useNavigate();
  const [chain, setChain] = useState<Chain | null>(null);
  const [tpsHistory, setTPSHistory] = useState<TPSHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllValidators, setShowAllValidators] = useState(false);
  const { theme } = useTheme();
  const [copied, setCopied] = useState<'chainId' | 'subnetId' | 'platformChainId' | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [chains, history] = await Promise.all([
          getChains(),
          chainId ? getTPSHistory(7, chainId) : Promise.resolve([])
        ]);
        
        const foundChain = chains.find(c => c.chainId === chainId);
        
        if (foundChain) {
          setChain(foundChain);
          setTPSHistory(history);
          setError(null);
        } else {
          setError('Chain not found');
        }
      } catch (err) {
        setError('Failed to load chain details');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [chainId]);

  const handleCopy = async (type: 'chainId' | 'subnetId' | 'platformChainId', value?: string) => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const getCurrentTPS = () => {
    if (!tpsHistory.length) return 'N/A';
    const latestTPS = tpsHistory[tpsHistory.length - 1].totalTps;
    return latestTPS.toFixed(2);
  };

  const getTPSColor = (tpsStr: string) => {
    if (tpsStr === 'N/A') return 'text-gray-400 dark:text-gray-500';
    const tps = Number(tpsStr);
    if (tps >= 1) return 'text-green-500 dark:text-green-400';
    if (tps >= 0.1) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const filteredValidators = chain?.validators.filter(validator =>
    validator.address.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayedValidators = showAllValidators 
    ? filteredValidators 
    : filteredValidators.slice(0, 10);

  const totalStake = chain?.validators.reduce((sum, v) => sum + v.weight, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !chain) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{error}</h2>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tpsValue = getCurrentTPS();
  const tpsColor = getTPSColor(tpsValue);
  const lastUpdate = tpsHistory.length > 0 ? tpsHistory[tpsHistory.length - 1].timestamp : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <ThemeToggle />
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                {chain.chainLogoUri ? (
                  <img 
                    src={chain.chainLogoUri} 
                    alt={`${chain.chainName} logo`}
                    className="w-16 h-16 rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Server className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{chain.chainName}</h1>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-500 dark:text-gray-400">Chain ID:</p>
                      <button
                        onClick={() => handleCopy('chainId', chain.chainId)}
                        className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        title="Click to copy Chain ID"
                      >
                        <span>{chain.chainId}</span>
                        {copied === 'chainId' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    {chain.subnetId && (
                      <div className="flex items-center gap-2">
                        <p className="text-gray-500 dark:text-gray-400">Subnet ID:</p>
                        <button
                          onClick={() => handleCopy('subnetId', chain.subnetId)}
                          className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          title="Click to copy Subnet ID"
                        >
                          <span>{chain.subnetId}</span>
                          {copied === 'subnetId' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {chain.platformChainId && (
                      <div className="flex items-center gap-2">
                        <p className="text-gray-500 dark:text-gray-400">Blockchain ID:</p>
                        <button
                          onClick={() => handleCopy('platformChainId', chain.platformChainId)}
                          className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          title="Click to copy Blockchain ID"
                        >
                          <span>{chain.platformChainId}</span>
                          {copied === 'platformChainId' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {chain.description && (
                <div className="mt-6 bg-gray-50 dark:bg-dark-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">About</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{chain.description}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="bg-gray-50 dark:bg-dark-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className={`w-5 h-5 ${tpsColor}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Current TPS</h3>
                </div>
                <p className={`text-3xl font-bold ${tpsColor}`}>{tpsValue}</p>
                {lastUpdate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Updated {format(new Date(lastUpdate * 1000), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-dark-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Validators</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {chain.validators.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Active validators on the network
                </p>
              </div>
            </div>

            {chain.networkToken && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Network Token</h3>
                <div className="flex items-center gap-3">
                  {chain.networkToken.logoUri && (
                    <img 
                      src={chain.networkToken.logoUri} 
                      alt={`${chain.networkToken.name} logo`}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{chain.networkToken.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{chain.networkToken.symbol}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <TPSChart chainId={chain.chainId} chainName={chain.chainName} />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <StakeDistributionChart validators={chain.validators} />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">Validators</h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by node ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-dark-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-dark-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Node ID
                      </th>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-dark-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stake
                      </th>
                      <th className="px-6 py-3 bg-gray-50 dark:bg-dark-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Uptime
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {displayedValidators.map((validator, index) => {
                      const percentage = ((validator.weight / totalStake) * 100).toFixed(2);
                      return (
                        <tr key={validator.address} className={index % 2 === 0 ? 'bg-white dark:bg-dark-800' : 'bg-gray-50 dark:bg-dark-800/50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {validator.active ? (
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mr-2" />
                                <span className="text-green-800 dark:text-green-300 text-sm">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 mr-2" />
                                <span className="text-red-800 dark:text-red-300 text-sm">Inactive</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ 
                                  backgroundColor: getValidatorColor(index, theme === 'dark', 0.8),
                                  border: `2px solid ${getValidatorColor(index, theme === 'dark')}` 
                                }}
                              />
                              {validator.explorerUrl ? (
                                <a
                                  href={validator.explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                                >
                                  {validator.address}
                                </a>
                              ) : (
                                <span className="text-sm text-gray-900 dark:text-gray-100">{validator.address}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {validator.weight.toLocaleString()} tokens ({percentage}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {validator.uptime ? `${validator.uptime.toFixed(2)}%` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredValidators.length > 10 && !showAllValidators && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllValidators(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Show All Validators ({filteredValidators.length})
                  </button>
                </div>
              )}

              {searchTerm && filteredValidators.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                  No validators found matching "{searchTerm}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}