import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { getChains } from '../api';
import { Chain } from '../types';
import { Server, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '../lib/utils';
import { useTheme } from '../hooks/useTheme';

interface NodePosition {
  x: number;
  y: number;
  orbit: number;
  angle: number;
  visible: boolean;
}

interface Bullet {
  id: string;
  fromChainId: string;
  toChainId: string;
  progress: number;
  speed: number;
  size: number;
  color: string;
  visible: boolean;
}

const ORBIT_CONFIG = {
  count: 3,
  baseRadius: 90,
  radiusIncrement: 65,
  baseSpeed: 0.000,
  speedMultiplier: 0.9,
  maxChainsPerOrbit: [9, 18, 54],
  tpsBasedExpansion: true,
};

const BULLET_BASE_SPEED = 0.25;
const MAX_BULLETS = 30;
const BULLET_SPAWN_RATE = 0.9;

export function NetworkTopologyGraph() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [hoveredChain, setHoveredChain] = useState<Chain | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const bulletIdCounter = useRef(0);
  const rotationAngles = useRef<number[]>([0, 0, 0]);

  useEffect(() => {
    async function fetchChains() {
      try {
        setLoading(true);
        const chainsData = await getChains();

        if (chainsData && chainsData.length > 0) {
          const validChains = chainsData.filter(chain =>
            (chain.validators && chain.validators.length > 0) ||
            chain.chainName.toLowerCase().includes('avalanche') ||
            chain.chainName.toLowerCase().includes('c-chain')
          );

          if (validChains.length > 0) {
            setChains(validChains);
            setError(null);
          } else {
            setError('No chains with validators available');
          }
        } else {
          setError('No chain data available');
        }
      } catch (err) {
        console.error('Failed to fetch chains for topology graph:', err);
        setError('Failed to load network data');
      } finally {
        setLoading(false);
      }
    }

    fetchChains();
  }, []);

  const cChain = useMemo(() => chains.find(chain =>
    chain.chainName.toLowerCase().includes('c-chain') ||
    chain.chainName.toLowerCase().includes('c chain')
  ), [chains]);

  const { centerChain, orbitChains } = useMemo(() => {
    const center = chains.find(chain =>
      chain.chainName.toLowerCase().includes('c-chain') ||
      chain.chainName.toLowerCase().includes('c chain')
    );

    const orbits = center
      ? chains.filter(chain => chain.chainId !== center.chainId)
      : [];

    return { centerChain: center, orbitChains: orbits };
  }, [chains]);

  const chainOrbits = useMemo(() => {
    if (!chains.length || !cChain) return new Map();

    const orbits = new Map<string, number>();
    const orbitCounts = [0, 0, 0];

    const sortedChains = [...orbitChains].sort((a, b) => {
      const aTps = a.tps?.value || 0;
      const bTps = b.tps?.value || 0;
      return bTps - aTps;
    });

    sortedChains.forEach(chain => {
      let assignedOrbit = 0;
      for (let i = 0; i < ORBIT_CONFIG.count; i++) {
        if (orbitCounts[i] < ORBIT_CONFIG.maxChainsPerOrbit[i]) {
          assignedOrbit = i;
          break;
        }
      }

      if (orbitCounts[assignedOrbit] >= ORBIT_CONFIG.maxChainsPerOrbit[assignedOrbit]) {
        assignedOrbit = ORBIT_CONFIG.count - 1;
      }

      orbits.set(chain.chainId, assignedOrbit);
      orbitCounts[assignedOrbit]++;
    });

    return orbits;
  }, [orbitChains, cChain]);

  const getNodeSize = (chain: Chain, isCenter: boolean) => {
    if (isCenter) return 80;

    if (chain.tps && typeof chain.tps.value === 'number') {
      const tpsValue = chain.tps.value;
      if (tpsValue <= 0.1) return 50;
      const scaleFactor = Math.min(2, 1 + Math.log10(tpsValue) * 0.1);
      return 60 * scaleFactor;
    }

    return 60;
  };

  const calculatePositions = useCallback(() => {
    if (!containerRef.current || chains.length === 0 || !cChain) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    setDimensions({ width, height });

    const centerX = width / 2;
    const centerY = height / 2;

    const newPositions = new Map<string, NodePosition>();

    newPositions.set(cChain.chainId, {
      x: centerX,
      y: centerY,
      orbit: -1,
      angle: 0,
      visible: true
    });

    const otherChains = chains.filter(chain => chain.chainId !== cChain.chainId);
    const orbitGroups: Chain[][] = [[], [], []];
    otherChains.forEach(chain => {
      const orbit = chainOrbits.get(chain.chainId) ?? 0;
      orbitGroups[orbit].push(chain);
    });

    orbitGroups.forEach((orbitChains, orbitIndex) => {
      if (orbitChains.length === 0) return;

      const radius = ORBIT_CONFIG.baseRadius + (orbitIndex * ORBIT_CONFIG.radiusIncrement);
      const currentRotation = rotationAngles.current[orbitIndex];

      orbitChains.forEach((chain, chainIndex) => {
        const baseAngle = (chainIndex / orbitChains.length) * 2 * Math.PI;
        const totalAngle = baseAngle + currentRotation;

        const x = centerX + radius * Math.cos(totalAngle);
        const y = centerY + radius * Math.sin(totalAngle);

        newPositions.set(chain.chainId, {
          x,
          y,
          orbit: orbitIndex,
          angle: totalAngle,
          visible: true
        });
      });
    });

    setPositions(newPositions);
  }, [chains, cChain, chainOrbits]);

  // Animation loop for rotation and bullets
  useEffect(() => {
    if (chains.length === 0 || !cChain) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (deltaTime > 100) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      for (let i = 0; i < ORBIT_CONFIG.count; i++) {
        const speed = ORBIT_CONFIG.baseSpeed * Math.pow(ORBIT_CONFIG.speedMultiplier, i);
        rotationAngles.current[i] += speed * deltaTime;
        rotationAngles.current[i] = rotationAngles.current[i] % (2 * Math.PI);
      }

      calculatePositions();

      setBullets(prevBullets => {
        const centerPosition = positions.get(cChain.chainId);
        if (!centerPosition) return prevBullets;

        const updatedBullets = prevBullets
          .map(bullet => {
            const newProgress = bullet.progress + (bullet.speed * deltaTime * 0.001);
            const visible = true;
            return { ...bullet, progress: newProgress, visible };
          })
          .filter(bullet => bullet.progress < 1 && bullet.visible);

        if (updatedBullets.length < MAX_BULLETS && Math.random() < BULLET_SPAWN_RATE) {
          const availableChains = chains.filter(chain => chain.chainId !== cChain.chainId);

          if (availableChains.length > 0) {
            const randomChain = availableChains[Math.floor(Math.random() * availableChains.length)];
            const direction = Math.random() > 0.5 ? 'outgoing' : 'incoming';

            const newBullet: Bullet = {
              id: `bullet-${bulletIdCounter.current++}`,
              fromChainId: direction === 'outgoing' ? cChain.chainId : randomChain.chainId,
              toChainId: direction === 'outgoing' ? randomChain.chainId : cChain.chainId,
              progress: 0,
              speed: BULLET_BASE_SPEED * (0.8 + Math.random() * 0.4),
              size: 3 + Math.random() * 3,
              color: getRandomBulletColor(),
              visible: true
            };

            return [...updatedBullets, newBullet];
          }
        }

        return updatedBullets;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chains, cChain, positions, calculatePositions]);

  useEffect(() => {
    calculatePositions();

    const handleResize = () => {
      calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculatePositions]);

  const getRandomBulletColor = () => {
    const colors = [
      '#E84142',
      '#3b82f6', '#60a5fa', '#93c5fd',
      '#6366f1', '#818cf8', '#a5b4fc',
      '#8b5cf6', '#a78bfa',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleChainClick = (chain: Chain) => {
    navigate(`/chain/${chain.chainId}`);
  };

  const createCurvedPath = (fromPos: NodePosition, toPos: NodePosition) => {
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2 - 30;
    return `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;
  };

  if (loading) {
    return (
      <div className="relative h-full">
        <div className={cn(
          "relative h-full rounded-xl p-1",
          isDark
            ? "border-[0.5px] border-white/10"
            : "border-[0.5px] border-gray-900/10"
        )}>
          <GlowingEffect
            spread={25}
            glow={true}
            disabled={false}
            proximity={60}
            inactiveZone={0.1}
            borderWidth={3}
            movementDuration={1.2}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg shadow-2xl",
            isDark
              ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
              : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
          )}>
            <div className="h-[500px] flex flex-col items-center justify-center">
              <RefreshCw className={cn(
                "h-12 w-12 animate-spin mb-4",
                isDark ? "text-white/60" : "text-gray-600"
              )} />
              <p className={cn(
                isDark ? "text-white/60" : "text-gray-600"
              )}>Loading network topology...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || chains.length === 0) {
    return (
      <div className="relative h-full">
        <div className={cn(
          "relative h-full rounded-xl p-1",
          isDark
            ? "border-[0.5px] border-white/10"
            : "border-[0.5px] border-gray-900/10"
        )}>
          <GlowingEffect
            spread={35}
            glow={true}
            disabled={false}
            proximity={60}
            inactiveZone={0.1}
            borderWidth={2}
            movementDuration={1.2}
          />
          <div className={cn(
            "relative h-full overflow-hidden rounded-lg shadow-2xl",
            isDark
              ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
              : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
          )}>
            <div className="h-[500px] flex flex-col items-center justify-center">
              <AlertTriangle className={cn(
                "h-12 w-12 mb-4",
                isDark ? "text-amber-400" : "text-amber-500"
              )} />
              <p className={cn(
                "text-center mb-4",
                isDark ? "text-white/60" : "text-gray-600"
              )}>
                {error || 'No network data available'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "inline-flex items-center px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200",
                  isDark
                    ? "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20"
                    : "bg-gray-900/10 hover:bg-gray-900/20 text-gray-800 hover:text-gray-900 border border-gray-900/20"
                )}
              >
                <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Outer container with glowing effect */}
      <div className={cn(
        "relative h-full rounded-xl p-1",
        isDark
          ? "border-[0.5px] border-white/10"
          : "border-[0.5px] border-gray-900/10"
      )}>
        <GlowingEffect
          spread={25}
          glow={true}
          disabled={false}
          proximity={60}
          inactiveZone={0.1}
          borderWidth={2}
          movementDuration={1.2}
        />

        {/* Inner content container */}
        <div className={cn(
          "relative h-full overflow-hidden rounded-lg shadow-2xl",
          isDark
            ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
            : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
        )}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 pb-2">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Network Topology
                </h3>
                <div className={cn(
                  "px-2.5 py-1 backdrop-blur-sm rounded-full",
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-900/10 border border-gray-900/20"
                )}>
                  <span className={cn(
                    "text-xs font-medium",
                    isDark ? "text-white/80" : "text-gray-800"
                  )}>
                    {chains.length} Chains
                  </span>
                </div>
                <button
                  onClick={() => {
                    bulletIdCounter.current = 0;
                    setBullets([]);
                  }}
                  className={cn(
                    "p-1.5 rounded-full backdrop-blur-sm transition-all duration-200",
                    isDark
                      ? "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80 border border-white/20"
                      : "bg-gray-900/10 hover:bg-gray-900/20 text-gray-600 hover:text-gray-800 border border-gray-900/20"
                  )}
                  title="Reset animation"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Graph Container */}
            <div
              ref={containerRef}
              className={cn(
                "relative flex-1 rounded-lg overflow-hidden mx-4 mb-4",
                isDark
                  ? "bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
                  : "bg-gradient-to-br from-gray-900/5 to-gray-900/[0.02] border border-gray-900/10"
              )}
            >
              {/* Background effect - theme aware */}
              <div className="absolute inset-0">
                {cChain && positions.get(cChain.chainId) && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <radialGradient id="centerGlow" cx="50%" cy="50%" r="60%">
                        <stop
                          offset="0%"
                          stopColor={isDark ? "rgba(232, 65, 66, 0.15)" : "rgba(232, 65, 66, 0.08)"}
                        />
                        <stop
                          offset="100%"
                          stopColor={isDark ? "rgba(232, 65, 66, 0)" : "rgba(232, 65, 66, 0)"}
                        />
                      </radialGradient>
                    </defs>

                    <circle
                      cx={positions.get(cChain.chainId)?.x}
                      cy={positions.get(cChain.chainId)?.y}
                      r="200"
                      fill="url(#centerGlow)"
                      className="animate-pulse-slow"
                    />

                    {[0, 1, 2].map(orbit => {
                      const centerPos = positions.get(cChain.chainId);
                      if (!centerPos) return null;

                      const radius = ORBIT_CONFIG.baseRadius + (orbit * ORBIT_CONFIG.radiusIncrement);
                      return (
                        <circle
                          key={orbit}
                          cx={centerPos.x}
                          cy={centerPos.y}
                          r={radius}
                          fill="none"
                          stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                          strokeWidth="1"
                          strokeDasharray="8,12"
                        />
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* Connections and bullets */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <filter id="bulletGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Draw connections - theme aware */}
                {chains.map(chain => {
                  const position = positions.get(chain.chainId);
                  if (!position || chain.chainId === cChain?.chainId) return null;

                  const centerPosition = positions.get(cChain?.chainId || '');
                  if (!centerPosition) return null;

                  const isHighlighted = hoveredChain?.chainId === chain.chainId || selectedChain?.chainId === chain.chainId;
                  const opacity = isHighlighted ? 0.8 : 0.4;

                  return (
                    <path
                      key={`connection-${chain.chainId}`}
                      d={createCurvedPath(centerPosition, position)}
                      fill="none"
                      stroke={isHighlighted
                        ? '#E84142'
                        : isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                      }
                      strokeWidth={isHighlighted ? "3" : "2"}
                      opacity={opacity}
                      strokeDasharray={isHighlighted ? "none" : "4,4"}
                      className="transition-all duration-300"
                    />
                  );
                })}

                {/* Draw bullets */}
                {bullets.filter(bullet => bullet.visible).map(bullet => {
                  const fromPosition = positions.get(bullet.fromChainId);
                  const toPosition = positions.get(bullet.toChainId);

                  if (!fromPosition || !toPosition) return null;

                  const t = bullet.progress;
                  const midX = (fromPosition.x + toPosition.x) / 2;
                  const midY = (fromPosition.y + toPosition.y) / 2 - 30;

                  const x = (1 - t) * (1 - t) * fromPosition.x + 2 * (1 - t) * t * midX + t * t * toPosition.x;
                  const y = (1 - t) * (1 - t) * fromPosition.y + 2 * (1 - t) * t * midY + t * t * toPosition.y;

                  return (
                    <circle
                      key={bullet.id}
                      cx={x}
                      cy={y}
                      r={bullet.size}
                      fill={bullet.color}
                      filter="url(#bulletGlow)"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>

              {/* Render chain nodes */}
              {chains.map(chain => {
                const position = positions.get(chain.chainId);
                if (!position) return null;

                const isCenter = chain.chainId === cChain?.chainId;
                const isHovered = chain.chainId === hoveredChain?.chainId;
                const isSelected = chain.chainId === selectedChain?.chainId;

                const nodeSize = getNodeSize(chain, isCenter);

                return (
                  <div
                    key={chain.chainId}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer 
                      ${isHovered || isSelected ? 'scale-110 z-20' : 'scale-100 z-10'}
                      ${isCenter ? 'z-30' : ''}
                    `}
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                      width: `${nodeSize}px`,
                      height: `${nodeSize}px`,
                    }}
                    onMouseEnter={() => setHoveredChain(chain)}
                    onMouseLeave={() => setHoveredChain(null)}
                    onClick={() => handleChainClick(chain)}
                  >
                    {isCenter && (
                      <div className={cn(
                        "absolute inset-2 rounded-full bg-gradient-to-br animate-pulse-slow",
                        isDark
                          ? "from-red-500/20 to-red-600/30"
                          : "from-red-500/15 to-red-600/20"
                      )}></div>
                    )}

                    <div className={cn(
                      "relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300",
                      isCenter
                        ? "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30"
                        : isDark
                          ? "bg-white/10 backdrop-blur-sm shadow-md border border-white/20"
                          : "bg-gray-900/10 backdrop-blur-sm shadow-md border border-gray-900/20",
                      (isHovered || isSelected) && !isCenter && (isDark
                        ? "border-white/40 shadow-xl"
                        : "border-gray-900/40 shadow-xl")
                    )}>
                      <div className={cn(
                        "w-full h-full rounded-full flex items-center justify-center",
                        isCenter && (isDark ? "bg-white/10 backdrop-blur-sm" : "bg-white/20 backdrop-blur-sm")
                      )}>
                        {chain.chainLogoUri ? (
                          <img
                            src={chain.chainLogoUri}
                            alt={chain.chainName}
                            className={`object-contain rounded-full ${isCenter ? 'w-3/4 h-3/4' : 'w-4/5 h-4/5'
                              }`}
                          />
                        ) : (
                          <Server className={cn(
                            isCenter ? 'w-1/2 h-1/2' : 'w-1/2 h-1/2',
                            isDark ? "text-white/80" : isCenter ? "text-white/80" : "text-gray-700"
                          )} />
                        )}
                      </div>
                    </div>

                    {(isHovered || isSelected) && (
                      <div className={cn(
                        "absolute -bottom-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap",
                        "px-3 py-2 rounded-md text-xs font-medium backdrop-blur-xl shadow-lg",
                        "animate-fade-in z-40",
                        isDark
                          ? "bg-white/10 border border-white/20 text-white"
                          : "bg-gray-900/90 border border-gray-900/30 text-white"
                      )}>
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{chain.chainName}</span>
                          {chain.tps && (
                            <span className={cn(
                              "text-xs",
                              chain.tps.value >= 1 ? 'text-emerald-400' :
                                chain.tps.value >= 0.1 ? 'text-amber-400' : 'text-red-400'
                            )}>
                              {chain.tps.value.toFixed(2)} TPS
                            </span>
                          )}
                          <span className={cn(
                            "text-xs",
                            isDark ? "text-white/60" : "text-white/80"
                          )}>
                            {chain.validators.length} validators
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtle gradient overlay for depth - theme aware */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none rounded-lg",
            isDark
              ? "from-white/[0.02] via-transparent to-black/10"
              : "from-gray-900/[0.02] via-transparent to-gray-900/10"
          )}></div>
        </div>
      </div>
    </div>
  );
}