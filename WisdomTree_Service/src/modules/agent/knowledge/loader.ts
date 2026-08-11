import * as fs from 'fs';
import * as path from 'path';

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
}

/**
 * Reads all .md files from the data directory, splits each file into chunks
 * by ## headings, and returns an array of KnowledgeChunk objects.
 */
export function loadKnowledgeFiles(dataDir: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  if (!fs.existsSync(dataDir)) {
    console.warn(`Knowledge data directory not found: ${dataDir}`);
    return chunks;
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceName = file.replace(/\.md$/, '');
    const fileChunks = splitFileIntoChunks(content, sourceName, file);
    chunks.push(...fileChunks);
  }

  return chunks;
}

/**
 * Split a markdown file into chunks by ## headings.
 * The first # heading is the document title.
 * Each ## heading plus its content becomes a chunk.
 * Content before the first ## heading is attached to the document title chunk.
 */
function splitFileIntoChunks(
  content: string,
  sourceName: string,
  filename: string,
): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const lines = content.split('\n');

  // Extract document title (first # heading)
  let docTitle = sourceName;
  for (const line of lines) {
    const titleMatch = line.match(/^#\s+(.+)/);
    if (titleMatch) {
      docTitle = titleMatch[1].trim();
      break;
    }
  }

  // Find all ## headings positions
  const sectionHeadings: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      sectionHeadings.push(i);
    }
  }

  // If no ## headings, create a single chunk from the whole file
  if (sectionHeadings.length === 0) {
    const cleanContent = lines.filter((l) => !l.startsWith('# ')).join('\n').trim();
    if (cleanContent) {
      const chunkId = `${sourceName}_0`;
      chunks.push({
        id: chunkId,
        title: docTitle,
        content: cleanContent,
        tags: extractTagsFromContent(cleanContent, docTitle),
        source: filename,
      });
    }
    return chunks;
  }

  // Create chunks for each ## section
  for (let i = 0; i < sectionHeadings.length; i++) {
    const startLine = sectionHeadings[i];
    const endLine = i + 1 < sectionHeadings.length ? sectionHeadings[i + 1] : lines.length;

    // Extract section title
    const headingMatch = lines[startLine].match(/^##\s+(.+)/);
    const sectionTitle = headingMatch ? headingMatch[1].trim() : '';

    // Section content (skip the heading line)
    const sectionContent = lines.slice(startLine + 1, endLine).join('\n').trim();

    if (!sectionContent) continue;

    const fullTitle = `${docTitle} - ${sectionTitle}`;
    const chunkId = `${sourceName}_${i + 1}`;
    const chunkContent = `## ${sectionTitle}\n${sectionContent}`;

    chunks.push({
      id: chunkId,
      title: fullTitle,
      content: chunkContent,
      tags: extractTagsFromContent(sectionContent, docTitle, sectionTitle),
      source: filename,
    });
  }

  return chunks;
}

/**
 * Extract meaningful Chinese tags from content and titles.
 */
function extractTagsFromContent(
  content: string,
  docTitle: string,
  sectionTitle?: string,
): string[] {
  const tags = new Set<string>();

  // Add word-level tags from titles
  const titleWords = (docTitle + ' ' + (sectionTitle || '')).split(/[\s,，、：:。.]+/);
  for (const word of titleWords) {
    const trimmed = word.trim();
    if (trimmed.length >= 2 && trimmed.length <= 8) {
      tags.add(trimmed);
    }
  }

  // Extract key terms from content (2-4 character meaningful segments)
  // Collect all Chinese segments
  const chineseParts = content.match(/[\u4e00-\u9fff]{2,6}/g) || [];
  // Count frequency for importance ranking
  const freq: Record<string, number> = {};
  for (const part of chineseParts) {
    freq[part] = (freq[part] || 0) + 1;
  }

  // Take high-frequency terms as tags
  const sorted = Object.entries(freq)
    .filter(([, count]) => count >= 3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);

  for (const [word] of sorted) {
    tags.add(word);
  }

  // Remove common stop words
  const stopWords = new Set([
    '一个', '一些', '可以', '如果', '因为', '所以', '但是', '然而',
    '还是', '或者', '需要', '应该', '可能', '已经', '没有', '什么',
    '怎么', '如何', '这个', '那个', '这些', '那些', '这样', '那样',
    '不是', '就是', '只是', '但是', '而且', '然后', '之后', '同时',
    '以及', '还有', '此外', '而是', '不会', '不能', '不同', '主要',
  ]);
  for (const word of tags) {
    if (stopWords.has(word)) {
      tags.delete(word);
    }
  }

  return Array.from(tags);
}
