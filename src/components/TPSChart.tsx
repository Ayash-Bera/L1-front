import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TPSHistory, NetworkTPS } from '../types';
import { getTPSHistory, getNetworkTPS } from '../api';
import { useTheme } from '../hooks/useTheme';
import { AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TPSChartProps {
  chainId?: string;
  chainName?: string;
}

export function TPSChart({ chainId, chainName }: TPSChartProps) {
  const { theme } = useTheme();
  const [tpsHistory, setTpsHistory] = useState<TPSHistory[]>([]);
  const [networkTPS, setNetworkTPS] = useState<NetworkTPS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        setRetrying(true);
        
        if (chainId) {
          const history = await getTPSHistory(7, chainId);
          if (mounted) {
            // Sort history by date in ascending order
            setTpsHistory(history.sort((a, b) => a.timestamp - b.timestamp));
            setNetworkTPS(null);
          }
        } else {
          const [history, current] = await Promise.all([
            getTPSHistory(7),
            getNetworkTPS()
          ]);
          if (mounted) {
            // Sort history by date in ascending order
            setTpsHistory(history.sort((a, b) => a.timestamp - b.timestamp));
            setNetworkTPS(current);
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch TPS data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setRetrying(false);
        }
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [chainId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
        <div className="h-64 flex flex-col items-center justify-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading TPS data...</p>
        </div>
      </div>
    );
  }

  if (error || !tpsHistory.length) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chainId ? `${chainName || 'Chain'} Transactions Per Second` : 'Network-wide Transactions Per Second (TPS)'}
              </h3>
            </div>
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            {error || 'No TPS data available at the moment'}
          </p>
          <button 
            onClick={() => {
              setRetrying(true);
              setLoading(true);
              setError(null);
              getTPSHistory(7, chainId).then(history => {
                setTpsHistory(history.sort((a, b) => a.timestamp - b.timestamp));
                setLoading(false);
                setRetrying(false);
              }).catch(err => {
                setError('Failed to fetch TPS data');
                setLoading(false);
                setRetrying(false);
              });
            }}
            disabled={retrying}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {retrying ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return format(date, 'MMM d');
    } catch (err) {
      console.warn('Date formatting error:', err);
      return 'Invalid date';
    }
  };

  const formatDateTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return format(date, 'MMM d, h:mm a');
    } catch (err) {
      console.warn('Date formatting error:', err);
      return 'Invalid date';
    }
  };

  // Get the latest TPS value from history
  const latestTPS = tpsHistory[tpsHistory.length - 1];

  const data = {
    labels: tpsHistory.map(item => formatDate(item.timestamp)),
    datasets: [
      {
        label: chainId ? `${chainName || 'Chain'} TPS` : 'Network-wide TPS',
        data: tpsHistory.map(item => item.totalTps),
        fill: true,
        borderColor: chainId 
          ? isDark ? 'rgb(129, 140, 248)' : 'rgb(99, 102, 241)'
          : isDark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)',
        backgroundColor: chainId
          ? isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.1)'
          : isDark ? 'rgba(74, 222, 128, 0.2)' : 'rgba(34, 197, 94, 0.1)',
        borderWidth: isDark ? 2 : 1.5,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? '#1e293b' : '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#e2e8f0' : '#1e293b',
        bodyColor: isDark ? '#e2e8f0' : '#1e293b',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        callbacks: {
          label: (context: any) => {
            const dataPoint = tpsHistory[context.dataIndex];
            if (chainId) {
              return [`TPS: ${context.parsed.y.toFixed(2)}`];
            }
            return [
              `TPS: ${context.parsed.y.toFixed(2)}`,
              `Active Chains: ${dataPoint.chainCount}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            size: 11,
          },
          callback: (value: any) => `${value.toFixed(1)} TPS`,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chainId ? `${chainName || 'Chain'} Transactions Per Second` : 'Network-wide Transactions Per Second (TPS)'}
            </h3>
          </div>
          {latestTPS && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {formatDateTime(latestTPS.timestamp)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {latestTPS ? latestTPS.totalTps.toFixed(2) : '0.00'} TPS
          </p>
          {!chainId && networkTPS && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Across {networkTPS.chainCount} active chains
            </p>
          )}
        </div>
      </div>

      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}