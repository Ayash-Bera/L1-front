import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Validator } from '../types';
import { useTheme } from '../hooks/useTheme';

ChartJS.register(ArcElement, Tooltip);

interface StakeDistributionChartProps {
  validators: Validator[];
}

export function StakeDistributionChart({ validators }: StakeDistributionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data, totalStake, colors } = useMemo(() => {
    // Calculate total stake
    const total = validators.reduce((sum, v) => sum + v.weight, 0);
    
    // Sort validators by stake weight in descending order
    const sortedValidators = [...validators].sort((a, b) => b.weight - a.weight);

    // Generate colors for the chart
    const generateColor = (index: number, alpha = 1) => {
      const hue = (index * 137.508) % 360; // Golden angle approximation
      const saturation = isDark ? '80%' : '70%';
      const lightness = isDark ? '60%' : '50%';
      return `hsla(${hue}, ${saturation}, ${lightness}, ${alpha})`;
    };

    // Generate colors map for validators
    const validatorColors = new Map(
      sortedValidators.map((validator, index) => [
        validator.address,
        {
          background: generateColor(index, 0.8),
          border: generateColor(index),
        }
      ])
    );

    // Prepare data for the chart
    const values = sortedValidators.map(v => v.weight);
    const backgroundColor = sortedValidators.map((_, i) => generateColor(i, 0.8));
    const borderColor = sortedValidators.map((_, i) => generateColor(i));

    return {
      data: {
        datasets: [{
          data: values,
          backgroundColor,
          borderColor,
          borderWidth: isDark ? 2 : 1,
        }],
      },
      totalStake: total,
      colors: validatorColors,
    };
  }, [validators, isDark]);

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
            const value = context.raw;
            const percentage = ((value / totalStake) * 100).toFixed(1);
            const validatorAddress = validators[context.dataIndex].address;
            return `${validatorAddress}: ${value.toLocaleString()} tokens (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stake Distribution</h3>
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="w-full md:w-3/4 h-[500px]">
          <Pie data={data} options={options} />
        </div>
        <div className="w-full md:w-1/4">
          <div className="bg-gray-50 dark:bg-dark-700/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Statistics</h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Total Stake</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                  {totalStake.toLocaleString()} tokens
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Validators</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                  {validators.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Average Stake</dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(totalStake / validators.length).toLocaleString()} tokens
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the color generation function to be used in the validators table
export function getValidatorColor(index: number, isDark: boolean, alpha = 1): string {
  const hue = (index * 137.508) % 360;
  const saturation = isDark ? '80%' : '70%';
  const lightness = isDark ? '60%' : '50%';
  return `hsla(${hue}, ${saturation}, ${lightness}, ${alpha})`;
}