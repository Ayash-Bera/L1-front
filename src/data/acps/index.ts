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
    folderName?: string; // Add folder name for proper GitHub links
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
        // Extract number and folder name from path: /src/data/acps-source/ACPs/118-warp-signature-request/README.md
        const folderMatch = filePath.match(/\/(\d+)-([^/]+)\/README\.md$/);
        if (!folderMatch) {
            console.warn(`Could not extract ACP info from path: ${filePath}`);
            return null;
        }

        const number = folderMatch[1];
        const folderName = `${folderMatch[1]}-${folderMatch[2]}`;
        console.log(`Processing ACP-${number} from ${filePath}, folder: ${folderName}`);

        // Parse the markdown table
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

            // Look for table start
            if (line.includes('| ACP |') || line.includes('| **ACP** |') || line.match(/\|\s*ACP\s*\|/)) {
                inTable = true;
                continue;
            }

            if (!inTable) continue;

            // Stop at next heading
            if (line.startsWith('##') || line.startsWith('# ')) break;

            // Parse table rows
            if (line.includes('| **Title** |') || line.includes('|Title|') || line.match(/\|\s*\*\*?Title\*\*?\s*\|/)) {
                const titleMatch = line.split('|');
                if (titleMatch.length >= 3) {
                    title = titleMatch[2].trim().replace(/\*\*/g, '');
                }
            } else if (line.includes('| **Author(s)** |') || line.includes('|Author(s)|') || line.includes('| Author(s) |') || line.match(/\|\s*\*\*?Author\(s\)\*\*?\s*\|/)) {
                const authorMatch = line.split('|');
                if (authorMatch.length >= 3) {
                    const authorText = authorMatch[2];
                    authors = parseAuthors(authorText);
                }
            } else if (line.includes('| **Status** |') || line.includes('|Status|') || line.match(/\|\s*\*\*?Status\*\*?\s*\|/)) {
                const statusMatch = line.split('|');
                if (statusMatch.length >= 3) {
                    const statusText = statusMatch[2] || '';
                    status = parseStatus(statusText);
                    discussion = parseDiscussionLink(statusText);
                }
            } else if (line.includes('| **Track** |') || line.includes('|Track|') || line.match(/\|\s*\*\*?Track\*\*?\s*\|/)) {
                const trackMatch = line.split('|');
                if (trackMatch.length >= 3) {
                    track = trackMatch[2].trim().replace(/\*\*/g, '');
                }
            } else if (line.includes('| **Depends-On** |') || line.includes('|Depends-On|') || line.match(/\|\s*\*\*?Depends-On\*\*?\s*\|/)) {
                const depsMatch = line.split('|');
                if (depsMatch.length >= 3) {
                    dependencies = parseACPReferences(depsMatch[2] || '');
                }
            } else if (line.includes('| **Replaces** |') || line.includes('|Replaces|') || line.match(/\|\s*\*\*?Replaces\*\*?\s*\|/)) {
                const replacesMatch = line.split('|');
                if (replacesMatch.length >= 3) {
                    replaces = parseACPReferences(replacesMatch[2] || '');
                }
            } else if (line.includes('| **Superseded-By** |') || line.includes('|Superseded-By|') || line.match(/\|\s*\*\*?Superseded-By\*\*?\s*\|/)) {
                const supersededMatch = line.split('|');
                if (supersededMatch.length >= 3) {
                    supersededBy = parseACPReferences(supersededMatch[2] || '');
                }
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
            supersededBy,
            folderName
        };
    } catch (error) {
        console.error(`Error parsing ACP from ${filePath}:`, error);
        return null;
    }
}

function parseAuthors(text: string): Array<{ name: string; github: string }> {
    const authors: Array<{ name: string; github: string }> = [];

    // Clean up the text
    const cleanText = text.trim().replace(/\*\*/g, '');
    console.log('Parsing authors from text:', cleanText);

    // Handle multiple authors separated by commas, "and", or line breaks
    const authorParts = cleanText.split(/[,\n]|\sand\s/).map(part => part.trim()).filter(part => part.length > 0);
    console.log('Author parts:', authorParts);

    authorParts.forEach((part, index) => {
        console.log(`Processing author part ${index}:`, part);

        // Skip table headers
        if (part.includes('Author(s)') || part === '---' || part === '|') {
            console.log('Skipping table header or separator');
            return;
        }

        // Pattern 1: Markdown link format "[Name](https://github.com/username)"
        const markdownLinkMatch = part.match(/\[([^\]]+)\]\(https?:\/\/github\.com\/([^)\/\s]+)[^)]*\)/);
        if (markdownLinkMatch && markdownLinkMatch[1] && markdownLinkMatch[2]) {
            const name = markdownLinkMatch[1].trim();
            const github = markdownLinkMatch[2].trim();
            console.log('Found markdown link format:', { name, github });
            if (name && github && name !== 'Author(s)') {
                authors.push({ name, github });
                return;
            }
        }

        // Pattern 2: "Name (@username)" or "Name (@username, @username2)"
        const usernameMatch = part.match(/([^(@\n]+?)\s*\(\s*[@]?([^)]+)\)/);
        if (usernameMatch && usernameMatch[1]) {
            const name = usernameMatch[1].trim();
            const githubPart = usernameMatch[2].trim();
            console.log('Found username format:', { name, githubPart });

            // Extract GitHub username (remove any URLs or extra text)
            let github = githubPart;

            // If it contains a GitHub URL, extract username from it
            const urlMatch = githubPart.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/\s\),]+)/);
            if (urlMatch && urlMatch[1]) {
                github = urlMatch[1];
                console.log('Extracted username from URL:', github);
            } else {
                // Remove @ symbol and any extra characters
                github = githubPart.replace(/[@\s]/g, '').split(/[,\s]/)[0];
                console.log('Cleaned username:', github);
            }

            if (name && github && name !== 'Author(s)') {
                authors.push({ name, github });
                return;
            }
        }

        // Pattern 3: Direct GitHub URL "https://github.com/username"
        const directUrlMatch = part.match(/https?:\/\/github\.com\/([^\/\s\),]+)/);
        if (directUrlMatch && directUrlMatch[1]) {
            const github = directUrlMatch[1];
            // Use the GitHub username as the display name if no other name is found
            const name = github;
            console.log('Found direct GitHub URL:', { name, github });
            authors.push({ name, github });
            return;
        }

        // Pattern 4: "Name <email@domain>" - extract name only
        const emailMatch = part.match(/([^<]+)\s*<[^>]+>/);
        if (emailMatch && emailMatch[1]) {
            const name = emailMatch[1].trim();
            if (name && name !== 'Author(s)') {
                // Generate a GitHub username from the name
                const github = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                console.log('Found email format:', { name, github });
                authors.push({ name, github });
                return;
            }
        }

        // Pattern 5: Just a name (fallback)
        const cleanPart = part.replace(/[|@]/g, '').trim();
        if (cleanPart && cleanPart !== 'Author(s)' && cleanPart.length > 1 && !cleanPart.includes('---') && !cleanPart.startsWith('http')) {
            const name = cleanPart;
            // Generate GitHub username from name
            const github = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            console.log('Using fallback name format:', { name, github });
            authors.push({ name, github });
        }
    });

    console.log('Final parsed authors:', authors);
    return authors;
}

function parseStatus(text: string): string {
    // Clean up the text
    const cleanText = text.trim().replace(/\*\*/g, '');

    // Extract status from markdown links or plain text
    const statusMatch = cleanText.match(/\[([^\]]+)\]|\b(Activated|Implementable|Proposed|Draft|Stale|Withdrawn|Final)\b/i);
    const status = (statusMatch?.[1] || statusMatch?.[2] || cleanText).trim();

    // Clean up any remaining markdown or extra text
    return status.replace(/\([^)]*\)/g, '').trim() || 'Unknown';
}

function parseDiscussionLink(text: string): string | undefined {
    // Pattern 1: [Discussion](URL)
    const match1 = text.match(/\[Discussion\]\(([^)]+)\)/i);
    if (match1?.[1]) {
        return match1[1].trim();
    }

    // Pattern 2: [Status Text](Discussion URL)
    const match2 = text.match(/\[[^\]]*\]\(([^)]*github\.com[^)]*)\)/i);
    if (match2?.[1] && match2[1].includes('discussions')) {
        return match2[1].trim();
    }

    // Pattern 3: Direct URL in the status field
    const match3 = text.match(/(https?:\/\/[^\s)]+)/);
    if (match3?.[1] && match3[1].includes('github') && match3[1].includes('discussions')) {
        return match3[1].trim();
    }

    return undefined;
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
        if (line.includes('| **Track** |') || line.includes('|Track|')) {
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