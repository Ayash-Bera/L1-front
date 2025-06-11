// src/data/acps/index.ts
export interface LocalACP {
    number: string;
    title: string;
    authors: Array<{ name: string; github: string }>;
    status: string;
    track: string;
    content: string;
    discussion?: string;
    // Enhanced metadata
    abstract?: string;
    complexity?: 'Low' | 'Medium' | 'High';
    tags?: string[];
    wordCount?: number;
    readingTime?: number;
    lastUpdated?: string;
    dependencies?: string[];
    replaces?: string[];
    supersededBy?: string[];
}

export interface ACPStats {
    total: number;
    byStatus: Record<string, number>;
    byTrack: Record<string, number>;
    byComplexity: Record<string, number>;
}

// Import all ACP markdown files from the submodule
// The actual structure is: src/data/acps-source/ACPs/{number}-{name}/README.md
const acpFiles = import.meta.glob('/src/data/acps-source/ACPs/*/README.md', {
    as: 'raw',
    eager: false
});

let cachedACPs: LocalACP[] | null = null;

export async function getAllLocalACPs(): Promise<LocalACP[]> {
    // Return cached results if available
    if (cachedACPs) {
        return cachedACPs;
    }

    const acps: LocalACP[] = [];

    try {
        console.log('Available ACP files:', Object.keys(acpFiles));
        console.log('Total files found:', Object.keys(acpFiles).length);

        for (const [path, contentLoader] of Object.entries(acpFiles)) {
            try {
                console.log(`Loading ACP from: ${path}`);
                const markdown = await contentLoader();
                const acp = parseACPMarkdown(markdown, path);
                if (acp) {
                    acps.push(acp);
                    console.log(`Successfully loaded ACP-${acp.number}: ${acp.title}`);
                }
            } catch (error) {
                console.warn(`Failed to load ACP from ${path}:`, error);
            }
        }

        console.log(`Loaded ${acps.length} ACPs total`);

        // Sort by number (newest first)
        cachedACPs = acps.sort((a, b) => Number(b.number) - Number(a.number));
        return cachedACPs;
    } catch (error) {
        console.error('Failed to load ACPs:', error);
        return [];
    }
}

export async function getACPByNumber(number: string): Promise<LocalACP | null> {
    const acps = await getAllLocalACPs();
    return acps.find(acp => acp.number === number) || null;
}

export async function getACPStats(): Promise<ACPStats> {
    const acps = await getAllLocalACPs();

    const stats: ACPStats = {
        total: acps.length,
        byStatus: {},
        byTrack: {},
        byComplexity: {}
    };

    acps.forEach(acp => {
        // Count by status
        stats.byStatus[acp.status] = (stats.byStatus[acp.status] || 0) + 1;

        // Count by track
        stats.byTrack[acp.track] = (stats.byTrack[acp.track] || 0) + 1;

        // Count by complexity
        if (acp.complexity) {
            stats.byComplexity[acp.complexity] = (stats.byComplexity[acp.complexity] || 0) + 1;
        }
    });

    return stats;
}

function parseACPMarkdown(markdown: string, filePath: string): LocalACP | null {
    try {
        // Extract number from path: /src/data/acps-source/ACPs/118-warp-signature-request/README.md -> "118"
        // The folder pattern is: {number}-{name}/README.md
        const numberMatch = filePath.match(/\/(\d+)-[^/]+\/README\.md$/);
        if (!numberMatch) {
            console.warn(`Could not extract ACP number from path: ${filePath}`);
            return null;
        }

        const number = numberMatch[1];
        console.log(`Processing ACP-${number} from ${filePath}`);

        // Parse the markdown table (reuse your existing logic)
        const lines = markdown.split('\n');
        let title = '';
        let authors: Array<{ name: string; github: string }> = [];
        let status = '';
        let track = '';
        let discussion = '';
        let dependencies: string[] = [];
        let replaces: string[] = [];
        let supersededBy: string[] = [];
        let inTable = false;

        for (const line of lines) {
            if (!line.trim()) continue;

            if (line.startsWith('| ACP |') || line.includes('| **ACP** |')) {
                inTable = true;
                continue;
            }

            if (!inTable) continue;
            if (line.startsWith('##')) break;

            if (line.includes('| **Title** |')) {
                title = line.split('|')[2]?.trim() || '';
            } else if (line.includes('| **Author(s)** |')) {
                const authorText = line.split('|')[2] || '';
                authors = parseAuthors(authorText);
            } else if (line.includes('| **Status** |')) {
                const statusText = line.split('|')[2] || '';
                status = parseStatus(statusText);
                discussion = parseDiscussionLink(statusText);
            } else if (line.includes('| **Track** |')) {
                track = line.split('|')[2]?.trim() || '';
            } else if (line.includes('| **Depends-On** |')) {
                dependencies = parseACPReferences(line.split('|')[2] || '');
            } else if (line.includes('| **Replaces** |')) {
                replaces = parseACPReferences(line.split('|')[2] || '');
            } else if (line.includes('| **Superseded-By** |')) {
                supersededBy = parseACPReferences(line.split('|')[2] || '');
            }
        }

        // Validate required fields
        if (!title || !status || !track) {
            console.warn(`ACP-${number} missing required fields:`, { title, status, track });
            return null;
        }

        // Extract enhanced metadata
        const abstract = extractAbstract(markdown);
        const wordCount = countWords(markdown);
        const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute
        const complexity = estimateComplexity(markdown, wordCount);
        const tags = extractTags(markdown, title);

        return {
            number,
            title,
            authors,
            status,
            track,
            content: markdown,
            discussion,
            abstract,
            complexity,
            tags,
            wordCount,
            readingTime,
            dependencies,
            replaces,
            supersededBy
        };
    } catch (error) {
        console.error(`Error parsing ACP from ${filePath}:`, error);
        return null;
    }
}

function parseAuthors(text: string): Array<{ name: string; github: string }> {
    const authors: Array<{ name: string; github: string }> = [];

    // Handle multiple authors separated by commas or "and"
    const authorParts = text.split(/,|\sand\s/).map(part => part.trim());

    authorParts.forEach(part => {
        // Match patterns like "John Doe (@johndoe)" or "John Doe"
        const match = part.match(/([^(@\n]+)(?:\s*\([@]?([^)]+)\))?/);
        if (match && match[1]) {
            const name = match[1].trim();
            const github = match[2]?.trim().replace('@', '') || name.toLowerCase().replace(/\s+/g, '');

            if (name && name !== '**Author(s)**') {
                authors.push({ name, github });
            }
        }
    });

    return authors;
}

function parseStatus(text: string): string {
    // Extract status from markdown links or plain text
    const statusMatch = text.match(/\[([^\]]+)\]|\b(\w+)\b/);
    return (statusMatch?.[1] || statusMatch?.[2] || 'Unknown').trim();
}

function parseDiscussionLink(text: string): string | undefined {
    const match = text.match(/\[Discussion\]\(([^)]+)\)/);
    return match?.[1];
}

function parseACPReferences(text: string): string[] {
    const matches = text.match(/ACP-(\d+)/g);
    return matches?.map(match => match.replace('ACP-', '')) || [];
}

function extractAbstract(markdown: string): string {
    // Look for ## Abstract section
    const abstractMatch = markdown.match(/##\s*Abstract\s*\n\n([^#]+)/i);
    if (abstractMatch) {
        const abstract = abstractMatch[1].trim();
        // Return first 200 characters with word boundary
        if (abstract.length > 200) {
            const truncated = abstract.substring(0, 200);
            const lastSpace = truncated.lastIndexOf(' ');
            return truncated.substring(0, lastSpace > 0 ? lastSpace : 200) + '...';
        }
        return abstract;
    }

    // Fallback: get first paragraph after the table
    const lines = markdown.split('\n');
    let afterTable = false;

    for (const line of lines) {
        if (line.startsWith('##') && afterTable) {
            break;
        }
        if (line.includes('| **Track** |')) {
            afterTable = true;
            continue;
        }
        if (afterTable && line.trim() && !line.startsWith('|') && !line.startsWith('#')) {
            return line.length > 200 ? line.substring(0, 200) + '...' : line;
        }
    }

    return '';
}

function countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

function estimateComplexity(markdown: string, wordCount: number): 'Low' | 'Medium' | 'High' {
    const content = markdown.toLowerCase();

    // High complexity indicators
    const highComplexityKeywords = [
        'consensus', 'protocol', 'cryptographic', 'algorithm', 'byzantine',
        'merkle', 'signature', 'verification', 'validator', 'staking'
    ];

    const mediumComplexityKeywords = [
        'implementation', 'specification', 'interface', 'architecture',
        'network', 'node', 'transaction', 'block'
    ];

    const highKeywordCount = highComplexityKeywords.filter(keyword =>
        content.includes(keyword)
    ).length;

    const mediumKeywordCount = mediumComplexityKeywords.filter(keyword =>
        content.includes(keyword)
    ).length;

    // Determine complexity based on word count and keyword presence
    if (wordCount > 4000 || highKeywordCount >= 3) return 'High';
    if (wordCount > 2000 || highKeywordCount >= 1 || mediumKeywordCount >= 3) return 'Medium';
    return 'Low';
}

function extractTags(markdown: string, title: string): string[] {
    const content = (markdown + ' ' + title).toLowerCase();

    const tagMap = {
        'subnet': ['subnet', 'subnets', 'l1'],
        'consensus': ['consensus', 'validator', 'staking'],
        'teleporter': ['teleporter', 'messaging', 'interchain'],
        'security': ['security', 'cryptographic', 'signature'],
        'performance': ['performance', 'optimization', 'efficiency'],
        'api': ['api', 'interface', 'rpc'],
        'governance': ['governance', 'voting', 'proposal'],
        'economics': ['economics', 'fee', 'reward', 'token'],
        'networking': ['network', 'peer', 'connection', 'protocol'],
        'virtual-machine': ['vm', 'virtual machine', 'evm'],
    };

    const tags: string[] = [];
    for (const [tag, keywords] of Object.entries(tagMap)) {
        if (keywords.some(keyword => content.includes(keyword))) {
            tags.push(tag);
        }
    }

    // Limit to top 5 most relevant tags
    return tags.slice(0, 5);
}

// Search and filtering utilities
export function searchACPs(acps: LocalACP[], query: string): LocalACP[] {
    if (!query.trim()) return acps;

    const searchTerm = query.toLowerCase();

    return acps.filter(acp =>
        acp.number.includes(searchTerm) ||
        acp.title.toLowerCase().includes(searchTerm) ||
        acp.authors.some(author => author.name.toLowerCase().includes(searchTerm)) ||
        acp.status.toLowerCase().includes(searchTerm) ||
        acp.track.toLowerCase().includes(searchTerm) ||
        acp.abstract?.toLowerCase().includes(searchTerm) ||
        acp.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
}

export function filterACPs(
    acps: LocalACP[],
    filters: {
        status?: string;
        track?: string;
        complexity?: string;
        author?: string;
        hasDiscussion?: boolean;
    }
): LocalACP[] {
    return acps.filter(acp => {
        if (filters.status && acp.status !== filters.status) return false;
        if (filters.track && acp.track !== filters.track) return false;
        if (filters.complexity && acp.complexity !== filters.complexity) return false;
        if (filters.author && !acp.authors.some(author =>
            author.name.toLowerCase().includes(filters.author!.toLowerCase())
        )) return false;
        if (filters.hasDiscussion !== undefined && Boolean(acp.discussion) !== filters.hasDiscussion) return false;

        return true;
    });
}

export function sortACPs(acps: LocalACP[], sortBy: 'number' | 'title' | 'status' | 'complexity', order: 'asc' | 'desc'): LocalACP[] {
    return [...acps].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'number':
                comparison = Number(a.number) - Number(b.number);
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            case 'complexity':
                const complexityOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
                comparison = (complexityOrder[a.complexity || 'Low']) - (complexityOrder[b.complexity || 'Low']);
                break;
        }

        return order === 'desc' ? -comparison : comparison;
    });
}