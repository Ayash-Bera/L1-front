import { Chain } from '../types';
import { Activity, Server, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '../lib/utils';
import { useTheme } from '../hooks/useTheme';

interface ChainCardProps {
  chain: Chain;
}

export function ChainCard({ chain }: ChainCardProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatTPS = (tps: Chain['tps']) => {
    if (!tps || typeof tps.value !== 'number') return 'N/A';
    return tps.value.toFixed(2);
  };

  const getTPSColor = (tpsStr: string) => {
    if (tpsStr === 'N/A') return isDark ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500';
    const tps = Number(tpsStr);
    if (tps >= 1) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (tps >= 0.1) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const getTPSGlow = (tpsStr: string) => {
    if (tpsStr === 'N/A') return '';
    const tps = Number(tpsStr);
    if (isDark) {
      if (tps >= 1) return 'shadow-emerald-500/20';
      if (tps >= 0.1) return 'shadow-amber-500/20';
      return 'shadow-red-500/20';
    } else {
      if (tps >= 1) return 'shadow-emerald-500/30';
      if (tps >= 0.1) return 'shadow-amber-500/30';
      return 'shadow-red-500/30';
    }
  };

  const tpsValue = formatTPS(chain.tps);
  const tpsColor = getTPSColor(tpsValue);
  const tpsGlow = getTPSGlow(tpsValue);

  return (
    <div className="relative h-full min-h-[180px]">
      {/* Outer container with theme-aware glowing effect */}
      <div className={cn(
        "relative h-full rounded-xl p-1",
        isDark
          ? "border-[0.5px] border-white/10"
          : "border-[0.5px] border-gray-900/10"
      )}>
        <GlowingEffect
          spread={55}
          glow={true}
          disabled={false}
          proximity={60}
          inactiveZone={0.1}
          borderWidth={2.5}
          movementDuration={1.2}
        />

        {/* Glassmorphic inner card - theme aware */}
        <div
          className={cn(
            "relative h-full cursor-pointer overflow-hidden rounded-lg",
            "shadow-2xl transition-all duration-300 hover:shadow-xl",
            "transform hover:-translate-y-0.5 hover:scale-[1.02]",
            isDark ? [
              // Dark mode styling (keep existing)
              "bg-white/5 backdrop-blur-xl",
              "border border-white/10",
              "shadow-black/10 hover:bg-white/10"
            ] : [
              // Light mode styling
              "bg-gray-900/5 backdrop-blur-xl",
              "border border-gray-900/10",
              "shadow-gray-900/10 hover:bg-gray-900/10"
            ]
          )}
          onClick={() => navigate(`/chain/${chain.chainId}`)}
        >
          {/* Content */}
          <div className="p-4">
            {/* Header with logo and main info */}
            <div className="flex items-start gap-3 mb-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                {chain.chainLogoUri ? (
                  <img
                    src={chain.chainLogoUri}
                    alt={`${chain.chainName} logo`}
                    className={cn(
                      "w-10 h-10 rounded-lg shadow-md",
                      isDark ? "ring-1 ring-white/20" : "ring-1 ring-gray-900/20"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                    isDark
                      ? "from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10"
                      : "from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-gray-900/10"
                  )}>
                    <Server className={cn(
                      "w-5 h-5",
                      isDark ? "text-blue-400" : "text-blue-600"
                    )} />
                  </div>
                )}
              </div>

              {/* Chain info */}
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "text-base font-bold truncate mb-0.5",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {chain.chainName}
                </h3>
                <div className={cn(
                  "flex items-center gap-2 text-xs",
                  isDark ? "text-white/60" : "text-gray-600"
                )}>
                  <span>ID: {chain.chainId}</span>
                  {chain.validators?.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{chain.validators.length} validators</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between mb-3">
              {/* TPS */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-md bg-gradient-to-br backdrop-blur-sm",
                  isDark
                    ? "from-white/10 to-white/5 border border-white/10"
                    : "from-gray-900/10 to-gray-900/5 border border-gray-900/10",
                  tpsGlow && `shadow-lg ${tpsGlow}`
                )}>
                  <Activity className={cn("w-3.5 h-3.5", tpsColor)} />
                </div>
                <div>
                  <div className={cn(
                    "text-xs leading-none",
                    isDark ? "text-white/60" : "text-gray-600"
                  )}>TPS</div>
                  <div className={cn("text-sm font-bold leading-none mt-0.5", tpsColor)}>
                    {tpsValue}
                  </div>
                </div>
              </div>

              {/* Validators */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-md bg-gradient-to-br backdrop-blur-sm shadow-lg",
                  isDark
                    ? "from-blue-500/20 to-blue-600/20 border border-blue-400/20 shadow-blue-500/10"
                    : "from-blue-500/20 to-blue-600/20 border border-blue-400/30 shadow-blue-500/20"
                )}>
                  <Server className={cn(
                    "w-3.5 h-3.5",
                    isDark ? "text-blue-300" : "text-blue-600"
                  )} />
                </div>
                <div>
                  <div className={cn(
                    "text-xs leading-none",
                    isDark ? "text-white/60" : "text-gray-600"
                  )}>Validators</div>
                  <div className={cn(
                    "text-sm font-bold leading-none mt-0.5",
                    isDark ? "text-blue-300" : "text-blue-600"
                  )}>
                    {chain.validators?.length || 0}
                  </div>
                </div>
              </div>

              {/* Network status indicator */}
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-2 h-2 rounded-full shadow-lg animate-pulse",
                  isDark
                    ? "bg-emerald-400 shadow-emerald-400/50"
                    : "bg-emerald-500 shadow-emerald-500/50"
                )}></div>
                <span className={cn(
                  "text-xs font-medium",
                  isDark ? "text-emerald-300" : "text-emerald-600"
                )}>Live</span>
              </div>
            </div>

            {/* Network token (if available) */}
            {chain.networkToken && (
              <div className={cn(
                "flex items-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r mb-3",
                isDark
                  ? "from-white/5 to-white/[0.02] border border-white/10"
                  : "from-gray-900/5 to-gray-900/[0.02] border border-gray-900/10"
              )}>
                {chain.networkToken.logoUri && (
                  <img
                    src={chain.networkToken.logoUri}
                    alt={`${chain.networkToken.name} logo`}
                    className={cn(
                      "w-4 h-4 rounded-full ring-1",
                      isDark ? "ring-white/20" : "ring-gray-900/20"
                    )}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-xs font-medium truncate",
                    isDark ? "text-white/80" : "text-gray-800"
                  )}>
                    {chain.networkToken.name}
                  </span>
                  <span className={cn(
                    "text-xs ml-1",
                    isDark ? "text-white/50" : "text-gray-500"
                  )}>
                    ({chain.networkToken.symbol})
                  </span>
                </div>
              </div>
            )}

            {/* Footer with last update */}
            {chain.tps?.timestamp && (
              <div className={cn(
                "flex items-center justify-between text-xs",
                isDark ? "text-white/40" : "text-gray-500"
              )}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Updated {format(new Date(chain.tps.timestamp * 1000), 'MMM d, HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Subtle gradient overlay for depth - theme aware */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg",
            isDark
              ? "from-white/[0.02] via-transparent to-black/10"
              : "from-gray-900/[0.02] via-transparent to-gray-900/10"
          )}></div>

          {/* Hover glow effect - theme aware */}
          <div className={cn(
            "absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg bg-gradient-to-br pointer-events-none",
            isDark
              ? "from-white/5 via-transparent to-transparent"
              : "from-gray-900/5 via-transparent to-transparent"
          )}></div>
        </div>
      </div>
    </div>
  );
}