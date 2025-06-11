import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { format } from 'date-fns';
import { RefreshCw, AlertTriangle, MessageSquare, Activity, Clock } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { GlowingEffect } from './ui/glowing-effect';
import { cn } from '../lib/utils';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface TeleporterMessage {
    source: string;
    target: string;
    value: number;
}

interface TeleporterData {
    messages: TeleporterMessage[];
    metadata: {
        totalMessages: number;
        timeWindow?: number;
        timeWindowUnit?: string;
        startDate?: string;
        endDate?: string;
        updatedAt: string;
    };
}

interface SankeyNode extends d3.SankeyNode<SankeyNode, SankeyLink> {
    name: string;
    id: string;
    color?: string;
    displayName?: string;
    originalName?: string;
}

interface SankeyLink extends d3.SankeyLink<SankeyNode, SankeyLink> {
    source: SankeyNode;
    target: SankeyNode;
    value: number;
    gradient?: string;
}

export function TeleporterSankeyDiagram() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [data, setData] = useState<TeleporterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredLink, setHoveredLink] = useState<SankeyLink | null>(null);
    const [hoveredNode, setHoveredNode] = useState<SankeyNode | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [selectedChain, setSelectedChain] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Function to format chain names for better readability
    const formatChainName = (name: string) => {
        if (!name) return 'Unknown';
        if (name === 'Avalanche (C-Chain)') return 'C-Chain';
        if (name === 'Dexalot L1') return 'Dexalot';
        if (name === 'zeroone Mainnet L1') return 'ZeroOne';
        if (name === 'Lamina1 L1') return 'Lamina1';
        if (name === 'PLYR PHI L1') return 'PLYR';
        return name;
    };

    // Generate a consistent color for a chain
    const getChainColor = useCallback((chainName: string) => {
        const colorMap: Record<string, string> = {
            'Avalanche (C-Chain)': '#E84142',
            'C-Chain': '#E84142',
            'Dexalot L1': '#2775CA',
            'Dexalot': '#2775CA',
            'zeroone Mainnet L1': '#8A2BE2',
            'ZeroOne': '#8A2BE2',
            'Lamina1 L1': '#00BFFF',
            'Lamina1': '#00BFFF',
            'PLYR PHI L1': '#32CD32',
            'PLYR': '#32CD32',
        };

        if (colorMap[chainName]) {
            return colorMap[chainName];
        }

        const hash = chainName.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);

        const h = Math.abs(hash) % 360;
        const s = '80%';
        const l = '60%';

        return `hsl(${h}, ${s}, ${l})`;
    }, []);

    // Function to find chain ID from chain name
    const findChainId = (chainName: string) => {
        const chainMap: Record<string, string> = {
            'Avalanche (C-Chain)': 'C',
            'C-Chain': 'C',
            'Dexalot L1': 'dexalot',
            'Dexalot': 'dexalot',
            'zeroone Mainnet L1': 'zeroone',
            'ZeroOne': 'zeroone',
            'Lamina1 L1': 'lamina1',
            'Lamina1': 'lamina1',
            'PLYR PHI L1': 'plyr',
            'PLYR': 'plyr',
        };

        return chainMap[chainName] || null;
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const endpoint = timeframe === 'daily'
                ? `${API_BASE_URL}/api/teleporter/messages/daily-count`
                : `${API_BASE_URL}/api/teleporter/messages/weekly-count`;

            console.log(`Fetching data from: ${endpoint}`);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log(`Response status: ${response.status}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const rawData = await response.json();
            console.log('Raw API data:', rawData);

            if (!rawData || !rawData.data || !Array.isArray(rawData.data)) {
                throw new Error('Invalid data format: Missing data array');
            }

            // Transform and filter the data - only show messages >= 5
            const messages = rawData.data
                .map((item: any) => ({
                    source: item.sourceChain || 'Unknown',
                    target: item.destinationChain || 'Unknown',
                    value: Number(item.messageCount) || 0
                }))
                .filter((msg: TeleporterMessage) => msg.value >= 0)
                .sort((a: TeleporterMessage, b: TeleporterMessage) => b.value - a.value);

            const totalMessages = rawData.metadata?.totalMessages ||
                messages.reduce((sum, msg) => sum + msg.value, 0);

            const processedData: TeleporterData = {
                messages,
                metadata: {
                    totalMessages,
                    timeWindow: timeframe === 'daily' ? 24 : 7,
                    timeWindowUnit: timeframe === 'daily' ? 'hours' : 'days',
                    updatedAt: rawData.metadata?.updatedAt || new Date().toISOString()
                }
            };

            console.log('Processed data:', processedData);
            setData(processedData);
        } catch (err) {
            console.error(`Failed to fetch ${timeframe} Teleporter messages:`, err);
            const sampleData = generateSampleData();
            setData(sampleData);
            setError(`Using sample data - API connection failed for ${timeframe} data. Check console for details.`);
        } finally {
            setLoading(false);
        }
    }, [timeframe]);

    // Generate sample data for demonstration
    const generateSampleData = (): TeleporterData => {
        const dailySampleMessages = [
            { source: 'Dexalot L1', target: 'Avalanche (C-Chain)', value: 408 },
            { source: 'Avalanche (C-Chain)', target: 'Dexalot L1', value: 362 },
            { source: 'Avalanche (C-Chain)', target: 'zeroone Mainnet L1', value: 124 },
            { source: 'Lamina1 L1', target: 'Avalanche (C-Chain)', value: 117 },
            { source: 'zeroone Mainnet L1', target: 'Avalanche (C-Chain)', value: 86 },
            { source: 'Avalanche (C-Chain)', target: 'PLYR PHI L1', value: 76 },
            { source: 'PLYR PHI L1', target: 'Avalanche (C-Chain)', value: 52 }
        ];

        const weeklySampleMessages = [
            { source: 'Dexalot L1', target: 'Avalanche (C-Chain)', value: 2845 },
            { source: 'Avalanche (C-Chain)', target: 'Dexalot L1', value: 2532 },
            { source: 'Avalanche (C-Chain)', target: 'zeroone Mainnet L1', value: 868 },
            { source: 'zeroone Mainnet L1', target: 'Avalanche (C-Chain)', value: 612 },
            { source: 'Lamina1 L1', target: 'Avalanche (C-Chain)', value: 819 },
            { source: 'Avalanche (C-Chain)', target: 'Lamina1 L1', value: 584 },
            { source: 'Avalanche (C-Chain)', target: 'PLYR PHI L1', value: 342 },
            { source: 'PLYR PHI L1', target: 'Avalanche (C-Chain)', value: 114 }
        ];

        const messages = timeframe === 'daily' ? dailySampleMessages : weeklySampleMessages;
        const totalMessages = messages.reduce((sum, msg) => sum + msg.value, 0);

        return {
            messages,
            metadata: {
                totalMessages,
                timeWindow: timeframe === 'daily' ? 24 : 7,
                timeWindowUnit: timeframe === 'daily' ? 'hours' : 'days',
                updatedAt: new Date().toISOString()
            }
        };
    };

    useEffect(() => {
        fetchData();
        setSelectedChain(null);
        // Clear any existing tooltips when timeframe changes
        setHoveredLink(null);
        setHoveredNode(null);
        const interval = setInterval(fetchData, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData, timeframe]);

    // Handle node click to navigate to chain details
    const handleNodeClick = (node: SankeyNode) => {
        const chainName = node.originalName;
        if (!chainName) return;

        const chainId = findChainId(chainName);
        if (chainId) {
            navigate(`/chain/${chainId}`);
        } else {
            setSelectedChain(selectedChain === node.name ? null : node.name);
        }
    };

    // Update tooltip position using container-relative coordinates
    const updateTooltipPosition = (event: MouseEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;

        setTooltipPosition({ x, y });
    };

    // Draw the Sankey diagram with theme awareness
    useEffect(() => {
        if (!data || !svgRef.current || !containerRef.current) return;

        // Clear previous diagram
        d3.select(svgRef.current).selectAll('*').remove();

        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = Math.max(400, container.clientHeight);

        const margin = { top: 20, right: 30, bottom: 20, left: 30 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        try {
            if (data.messages.length === 0) {
                throw new Error('No message data available');
            }

            // Create nodes map
            const nodesMap = new Map();

            data.messages.forEach((msg) => {
                const sourceKey = `source-${msg.source}`;
                const targetKey = `target-${msg.target}`;

                if (!nodesMap.has(sourceKey)) {
                    nodesMap.set(sourceKey, {
                        name: sourceKey,
                        displayName: formatChainName(msg.source),
                        originalName: msg.source,
                        isSource: true,
                        color: getChainColor(msg.source)
                    });
                }

                if (!nodesMap.has(targetKey)) {
                    nodesMap.set(targetKey, {
                        name: targetKey,
                        displayName: formatChainName(msg.target),
                        originalName: msg.target,
                        isSource: false,
                        color: getChainColor(msg.target)
                    });
                }
            });

            const nodes = Array.from(nodesMap.values());

            const links = data.messages.map(msg => ({
                source: `source-${msg.source}`,
                target: `target-${msg.target}`,
                value: msg.value
            }));

            // Filter based on selected chain
            let filteredLinks = links;
            let filteredNodes = nodes;

            if (selectedChain) {
                filteredLinks = links.filter(link =>
                    link.source === selectedChain || link.target === selectedChain
                );

                const nodeNames = new Set();
                filteredLinks.forEach(link => {
                    nodeNames.add(link.source);
                    nodeNames.add(link.target);
                });

                filteredNodes = nodes.filter(node => nodeNames.has(node.name));
            }

            // Create the Sankey generator
            const sankeyGenerator = sankey<any, any>()
                .nodeId(d => d.name)
                .nodeWidth(25)
                .nodePadding(15)
                .extent([[0, 0], [width, height]]);

            const sankeyData = sankeyGenerator({
                nodes: filteredNodes,
                links: filteredLinks
            });

            // Create definitions for gradients
            const defs = svg.append('defs');

            // Create gradients for links
            sankeyData.links.forEach((link, i) => {
                const gradientId = `link-gradient-${i}`;

                const gradient = defs.append('linearGradient')
                    .attr('id', gradientId)
                    .attr('gradientUnits', 'userSpaceOnUse')
                    .attr('x1', link.source.x1)
                    .attr('x2', link.target.x0);

                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', link.source.color);

                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', link.target.color);

                link.gradient = gradientId;
            });

            // Draw the links
            const linkGroup = svg.append('g')
                .attr('class', 'links')
                .attr('fill', 'none')
                .attr('stroke-opacity', 0.4);

            const links_g = linkGroup.selectAll('g')
                .data(sankeyData.links)
                .enter()
                .append('g')
                .attr('class', 'link-group');

            const linkPaths = links_g.append('path')
                .attr('d', sankeyLinkHorizontal())
                .attr('stroke', d => `url(#${d.gradient})`)
                .attr('stroke-width', d => Math.max(1, d.width))
                .attr('opacity', d =>
                    selectedChain ?
                        (d.source.name === selectedChain || d.target.name === selectedChain ? 0.8 : 0.2) :
                        0.6
                )
                .style('transition', 'opacity 0.3s ease, stroke-width 0.3s ease')
                .style('cursor', 'pointer');

            // Add interaction to links
            linkPaths
                .on('mouseover', function (event, d) {
                    d3.select(this)
                        .attr('stroke-opacity', 0.8)
                        .attr('stroke-width', d => Math.max(1, d.width + 2));

                    setHoveredLink(d);
                    setHoveredNode(null);
                    updateTooltipPosition(event);
                })
                .on('mousemove', function (event) {
                    updateTooltipPosition(event);
                })
                .on('mouseleave', function () {
                    d3.select(this)
                        .attr('stroke-opacity', 0.4)
                        .attr('stroke-width', d => Math.max(1, d.width));

                    setHoveredLink(null);
                });

            // Draw the nodes
            const nodeGroup = svg.append('g').attr('class', 'nodes');

            const nodes_g = nodeGroup.selectAll('g')
                .data(sankeyData.nodes)
                .enter()
                .append('g')
                .attr('class', 'node-group')
                .attr('transform', d => `translate(${d.x0},${d.y0})`)
                .style('cursor', 'pointer')
                .on('click', function (event, d) {
                    handleNodeClick(d);
                    event.stopPropagation();
                })
                .on('mouseover', function (event, d) {
                    setHoveredNode(d);
                    setHoveredLink(null);
                    updateTooltipPosition(event);
                })
                .on('mousemove', function (event) {
                    updateTooltipPosition(event);
                })
                .on('mouseleave', function () {
                    setHoveredNode(null);
                });

            // Add node rectangles with gradients
            nodes_g.each(function (d) {
                const node = d3.select(this);
                const gradientId = `node-gradient-${d.index}`;

                const gradient = defs.append('linearGradient')
                    .attr('id', gradientId)
                    .attr('x1', '0%')
                    .attr('y1', '0%')
                    .attr('x2', '100%')
                    .attr('y2', '100%');

                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', d3.color(d.color)?.brighter(0.5)?.toString() || d.color);

                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', d3.color(d.color)?.darker(0.3)?.toString() || d.color);

                node.append('rect')
                    .attr('height', d.y1 - d.y0)
                    .attr('width', d.x1 - d.x0)
                    .attr('fill', `url(#${gradientId})`)
                    .attr('stroke', d3.color(d.color)?.darker(0.5)?.toString() || '#000')
                    .attr('stroke-width', 1)
                    .attr('rx', 4)
                    .attr('ry', 4)
                    .attr('opacity', selectedChain ? (d.name === selectedChain ? 1 : 0.7) : 0.9)
                    .style('transition', 'opacity 0.3s ease');

                node.append('rect')
                    .attr('height', d.y1 - d.y0)
                    .attr('width', d.x1 - d.x0)
                    .attr('fill', 'none')
                    .attr('stroke', isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                    .attr('stroke-width', 1)
                    .attr('rx', 4)
                    .attr('ry', 4)
                    .attr('opacity', 0.5);

                // Add glow for selected nodes
                if (selectedChain === d.name) {
                    const glowId = `glow-${d.index}`;

                    defs.append('filter')
                        .attr('id', glowId)
                        .attr('x', '-20%')
                        .attr('y', '-20%')
                        .attr('width', '140%')
                        .attr('height', '140%')
                        .append('feGaussianBlur')
                        .attr('stdDeviation', '3')
                        .attr('result', 'blur');

                    node.append('rect')
                        .attr('height', d.y1 - d.y0)
                        .attr('width', d.x1 - d.x0)
                        .attr('fill', 'none')
                        .attr('stroke', d.color)
                        .attr('stroke-width', 2)
                        .attr('rx', 4)
                        .attr('ry', 4)
                        .attr('filter', `url(#${glowId})`)
                        .attr('opacity', 0.7);
                }
            });

            // Add labels using CSS classes for proper theming
            nodes_g.append('text')
                .attr('x', d => d.x0 < width / 2 ? d.x1 - d.x0 + 6 : -6)
                .attr('y', d => (d.y1 - d.y0) / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
                .attr('class', 'node-label')
                .text(d => d.displayName)
                .attr('font-weight', 'bold')
                .attr('font-size', '12px')
                .attr('fill', isDark ? '#ffffff' : '#000000')
                .attr('pointer-events', 'none');

            // Add title
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', -5)
                .attr('class', 'diagram-title')
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(30, 41, 59, 0.7)')
                .text(`Total: ${data.metadata.totalMessages.toLocaleString()} messages`);

            // Add reset button if a chain is selected
            if (selectedChain) {
                const resetButton = svg.append('g')
                    .attr('class', 'reset-button')
                    .attr('transform', `translate(${width - 80}, ${height - 30})`)
                    .style('cursor', 'pointer')
                    .on('click', () => setSelectedChain(null));

                resetButton.append('rect')
                    .attr('width', 80)
                    .attr('height', 24)
                    .attr('rx', 12)
                    .attr('ry', 12)
                    .attr('fill', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
                    .attr('stroke', isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)')
                    .attr('stroke-width', 1);

                resetButton.append('text')
                    .attr('x', 40)
                    .attr('y', 12)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', '10px')
                    .attr('fill', isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)')
                    .text('Reset Filter');
            }

            // Add click handler to reset selection and clear tooltips when clicking empty space
            svg.on('click', () => {
                if (selectedChain) {
                    setSelectedChain(null);
                }
            })
                .on('mouseleave', () => {
                    // Clear tooltips when mouse leaves the entire SVG area
                    setHoveredLink(null);
                    setHoveredNode(null);
                });

        } catch (err) {
            console.error('Error rendering Sankey diagram:', err);

            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .attr('class', 'node-label')
                .attr('fill', isDark ? '#ffffff' : '#000000')
                .text('Error rendering diagram. Please try again.');

            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2 + 30)
                .attr('text-anchor', 'middle')
                .attr('class', 'value-label')
                .attr('font-size', '12px')
                .attr('fill', isDark ? 'rgba(226, 232, 240, 0.7)' : 'rgba(30, 41, 59, 0.7)')
                .text(err instanceof Error ? err.message : 'Unknown error');
        }

    }, [data, getChainColor, selectedChain, navigate, handleNodeClick, isDark]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (data) {
                const timer = setTimeout(() => {
                    if (svgRef.current && containerRef.current) {
                        d3.select(svgRef.current).selectAll('*').remove();
                        setData({ ...data });
                    }
                }, 100);
                return () => clearTimeout(timer);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [data]);

    // Cleanup tooltips on component unmount
    useEffect(() => {
        return () => {
            setHoveredLink(null);
            setHoveredNode(null);
        };
    }, []);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const getTimeSinceUpdate = (): string => {
        if (!data?.metadata.updatedAt) return 'Unknown';

        const updateTime = new Date(data.metadata.updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - updateTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
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
                        borderWidth={2}
                        movementDuration={1.2}
                    />
                    <div className={cn(
                        "relative h-full overflow-hidden rounded-lg shadow-2xl",
                        isDark
                            ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                            : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
                    )}>
                        <div className="h-[400px] flex flex-col items-center justify-center">
                            <RefreshCw className={cn(
                                "h-12 w-12 animate-spin mb-4",
                                isDark ? "text-white/60" : "text-gray-600"
                            )} />
                            <p className={cn(
                                isDark ? "text-white/60" : "text-gray-600"
                            )}>Loading message flow data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
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
                        borderWidth={2}
                        movementDuration={1.2}
                    />
                    <div className={cn(
                        "relative h-full overflow-hidden rounded-lg shadow-2xl",
                        isDark
                            ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                            : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
                    )}>
                        <div className="h-[400px] flex flex-col items-center justify-center">
                            <AlertTriangle className={cn(
                                "h-12 w-12 mb-4",
                                isDark ? "text-amber-400" : "text-amber-500"
                            )} />
                            <p className={cn(
                                "text-center mb-4",
                                isDark ? "text-white/60" : "text-gray-600"
                            )}>
                                No Teleporter message data available
                            </p>
                            <button
                                onClick={fetchData}
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

                <div className={cn(
                    "relative h-full overflow-hidden rounded-lg shadow-2xl",
                    isDark
                        ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-black/10"
                        : "bg-gray-900/5 backdrop-blur-xl border border-gray-900/10 shadow-gray-900/10"
                )}>
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className={cn(
                                    "text-lg font-semibold",
                                    isDark ? "text-white" : "text-gray-900"
                                )}>
                                    Avalanche Teleporter Messages
                                </h3>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "backdrop-blur-sm rounded-full p-1 flex items-center",
                                    isDark
                                        ? "bg-white/10 border border-white/20"
                                        : "bg-gray-900/10 border border-gray-900/20"
                                )}>
                                    <button
                                        onClick={() => setTimeframe('daily')}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                                            timeframe === 'daily'
                                                ? isDark
                                                    ? 'bg-white/20 text-white border border-white/30'
                                                    : 'bg-gray-900/20 text-gray-900 border border-gray-900/30'
                                                : isDark
                                                    ? 'text-white/60 hover:bg-white/10 hover:text-white/80'
                                                    : 'text-gray-600 hover:bg-gray-900/10 hover:text-gray-800'
                                        )}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setTimeframe('weekly')}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                                            timeframe === 'weekly'
                                                ? isDark
                                                    ? 'bg-white/20 text-white border border-white/30'
                                                    : 'bg-gray-900/20 text-gray-900 border border-gray-900/30'
                                                : isDark
                                                    ? 'text-white/60 hover:bg-white/10 hover:text-white/80'
                                                    : 'text-gray-600 hover:bg-gray-900/10 hover:text-gray-800'
                                        )}
                                    >
                                        Weekly
                                    </button>
                                </div>

                                <button
                                    onClick={fetchData}
                                    className={cn(
                                        "p-1.5 rounded-full backdrop-blur-sm transition-all duration-200",
                                        isDark
                                            ? "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80 border border-white/20"
                                            : "bg-gray-900/10 hover:bg-gray-900/20 text-gray-600 hover:text-gray-800 border border-gray-900/20"
                                    )}
                                    title="Refresh data"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className={cn(
                                "border rounded-lg p-3 mb-4 flex items-start gap-2",
                                isDark
                                    ? "bg-amber-500/10 border-amber-500/20"
                                    : "bg-amber-500/10 border-amber-500/30"
                            )}>
                                <AlertTriangle className={cn(
                                    "w-5 h-5 mt-0.5 flex-shrink-0",
                                    isDark ? "text-amber-400" : "text-amber-600"
                                )} />
                                <div>
                                    <p className={cn(
                                        "text-sm",
                                        isDark ? "text-amber-300" : "text-amber-700"
                                    )}>
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div
                            ref={containerRef}
                            className={cn(
                                "relative backdrop-blur-sm rounded-lg h-[400px] overflow-hidden",
                                isDark
                                    ? "bg-white/5 border border-white/10"
                                    : "bg-gray-900/5 border border-gray-900/10"
                            )}
                            onMouseLeave={() => {
                                // Clear tooltips when mouse leaves the container
                                setHoveredLink(null);
                                setHoveredNode(null);
                            }}
                        >
                            <svg
                                ref={svgRef}
                                className="w-full h-full"
                            ></svg>

                            {/* Enhanced Tooltip */}
                            {(hoveredLink || hoveredNode) && (
                                <div
                                    ref={tooltipRef}
                                    className={cn(
                                        "absolute z-50 backdrop-blur-xl p-3 rounded-lg shadow-xl text-sm pointer-events-none max-w-xs transition-opacity duration-150",
                                        isDark
                                            ? "bg-black/90 text-white border border-white/20"
                                            : "bg-white/90 text-gray-900 border border-gray-900/20"
                                    )}
                                    style={{
                                        left: `${Math.min(tooltipPosition.x + 10, containerRef.current?.clientWidth - 200 || 0)}px`,
                                        top: `${Math.max(tooltipPosition.y - 10, 10)}px`,
                                        transform: tooltipPosition.y > 200 ? 'translateY(-100%)' : 'translateY(0)',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {hoveredLink && (
                                        <>
                                            <div className={cn(
                                                "font-medium mb-1",
                                                isDark ? "text-white" : "text-gray-900"
                                            )}>
                                                {hoveredLink.source.displayName} → {hoveredLink.target.displayName}
                                            </div>
                                            <div className={cn(
                                                isDark ? "text-white/80" : "text-gray-700"
                                            )}>
                                                Messages: <span className="font-semibold">{hoveredLink.value.toLocaleString()}</span>
                                            </div>
                                            <div className={cn(
                                                isDark ? "text-white/80" : "text-gray-700"
                                            )}>
                                                {((hoveredLink.value / data.metadata.totalMessages) * 100).toFixed(1)}% of total
                                            </div>
                                        </>
                                    )}
                                    {hoveredNode && !hoveredLink && (
                                        <>
                                            <div className={cn(
                                                "font-medium mb-1",
                                                isDark ? "text-white" : "text-gray-900"
                                            )}>
                                                {hoveredNode.displayName}
                                            </div>
                                            <div className={cn(
                                                isDark ? "text-white/80" : "text-gray-700"
                                            )}>
                                                Total messages: <span className="font-semibold">{hoveredNode.value?.toLocaleString?.() || 0}</span>
                                            </div>
                                            <div className={cn(
                                                isDark ? "text-white/80" : "text-gray-700"
                                            )}>
                                                {((hoveredNode.value || 0) / data.metadata.totalMessages * 100).toFixed(1)}% of total
                                            </div>
                                            <div className={cn(
                                                "text-xs mt-1",
                                                isDark ? "text-blue-400" : "text-blue-600"
                                            )}>
                                                Click to {findChainId(hoveredNode.originalName || '') ? 'view chain details' : selectedChain === hoveredNode.name ? 'reset filter' : 'filter connections'}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className={cn(
                                "flex items-center bg-gradient-to-r backdrop-blur-sm rounded-lg overflow-hidden shadow-lg",
                                isDark
                                    ? "from-blue-500/20 to-purple-500/20 border border-white/20"
                                    : "from-blue-500/10 to-purple-500/10 border border-gray-900/20"
                            )}>
                                <div className="px-3 py-2 flex items-center gap-2">
                                    <div className={cn(
                                        "rounded-full p-1.5",
                                        isDark ? "bg-white/20" : "bg-gray-900/20"
                                    )}>
                                        <MessageSquare className={cn(
                                            "w-4 h-4",
                                            isDark ? "text-white" : "text-gray-800"
                                        )} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-xs font-medium",
                                            isDark ? "text-white/70" : "text-gray-600"
                                        )}>Shown Messages (≥5)</span>
                                        <span className={cn(
                                            "text-lg font-bold",
                                            isDark ? "text-white" : "text-gray-900"
                                        )}>{formatNumber(data.messages.reduce((sum, msg) => sum + msg.value, 0))}</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "h-full w-px",
                                    isDark ? "bg-white/20" : "bg-gray-900/20"
                                )}></div>
                                <div className="px-3 py-2 flex items-center gap-2">
                                    <div className={cn(
                                        "rounded-full p-1.5",
                                        isDark ? "bg-white/20" : "bg-gray-900/20"
                                    )}>
                                        <Activity className={cn(
                                            "w-4 h-4",
                                            isDark ? "text-white" : "text-gray-800"
                                        )} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-xs font-medium",
                                            isDark ? "text-white/70" : "text-gray-600"
                                        )}>Timeframe</span>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            isDark ? "text-white" : "text-gray-900"
                                        )}>{timeframe === 'daily' ? 'Daily' : 'Weekly'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={cn(
                                "flex items-center gap-2 px-3 py-2 backdrop-blur-sm rounded-full shadow-sm",
                                isDark
                                    ? "bg-white/10 border border-white/20"
                                    : "bg-gray-900/10 border border-gray-900/20"
                            )}>
                                <Clock className={cn(
                                    "w-4 h-4",
                                    isDark ? "text-white/60" : "text-gray-600"
                                )} />
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "text-xs font-medium",
                                            isDark ? "text-white" : "text-gray-900"
                                        )}>Last updated:</span>
                                        <span className={cn(
                                            "text-xs font-bold",
                                            isDark ? "text-white" : "text-gray-900"
                                        )}>
                                            {format(new Date(data.metadata.updatedAt), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "text-xs",
                                        isDark ? "text-white/60" : "text-gray-600"
                                    )}>
                                        {getTimeSinceUpdate()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

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