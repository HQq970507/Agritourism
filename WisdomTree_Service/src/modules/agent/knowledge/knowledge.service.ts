import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { KnowledgeChunk, loadKnowledgeFiles } from './loader';

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);
  private chunks: KnowledgeChunk[] = [];
  private keywordIndex: Map<string, number[]> = new Map(); // keyword -> chunk indices
  private initialized = false;

  // Chinese stop words to filter out during keyword extraction
  private readonly stopWords = new Set([
    '一个', '一些', '可以', '如果', '因为', '所以', '但是', '然而',
    '还是', '或者', '需要', '应该', '可能', '已经', '没有', '什么',
    '怎么', '如何', '这个', '那个', '这些', '那些', '这样', '那样',
    '不是', '就是', '只是', '但是', '而且', '然后', '之后', '同时',
    '以及', '还有', '此外', '而是', '不会', '不能', '不同', '主要',
    '我们', '他们', '它们', '你们', '自己', '这里', '那里', '每个',
    '有的', '很多', '一些', '部分', '全部', '所有', '时候', '情况',
    '方式', '方法', '进行', '通过', '利用', '使用', '采用', '分为',
    '包括', '属于', '位于', '成为', '作为', '进入', '以上', '以下',
    '左右', '之间', '例如', '比如', '通常', '一般', '比较', '相对',
    '特别', '非常', '更加', '较为', '较为', '十分', '相当', '适量',
    '建议', '注意', '需要', '应该', '可以', '最好', '不宜', '避免',
    '防止', '保证', '促进', '达到', '提高', '降低', '增加', '减少',
  ]);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.loadAndIndex();
  }

  /**
   * Load all knowledge files and build the keyword index.
   */
  async loadAndIndex(): Promise<void> {
    // Resolve data directory path
    const dataDir = path.resolve(__dirname, '..', 'knowledge', 'data');
    this.chunks = loadKnowledgeFiles(dataDir);

    if (this.chunks.length === 0) {
      // Fallback: try relative path from project root
      const altDir = path.resolve(
        process.cwd(),
        'src',
        'modules',
        'agent',
        'knowledge',
        'data',
      );
      this.chunks = loadKnowledgeFiles(altDir);
    }

    this.buildIndex();
    this.initialized = true;

    this.logger.log(
      `KnowledgeService initialized with ${this.chunks.length} chunks across ${this.getSourceCount()} sources`,
    );
  }

  /**
   * Wait for initialization to complete.
   */
  async waitForInit(): Promise<void> {
    if (this.initialized) return;
    // If not yet initialized (called before onModuleInit completes), load synchronously
    await this.loadAndIndex();
  }

  /**
   * Search knowledge base for relevant chunks.
   * Uses keyword matching with frequency scoring.
   * Returns topK chunks with highest relevance scores.
   */
  async search(query: string, topK: number = 5): Promise<KnowledgeChunk[]> {
    await this.waitForInit();

    if (this.chunks.length === 0 || !query.trim()) {
      return [];
    }

    // Extract keywords from the search query
    const queryKeywords = this.extractKeywords(query);

    if (queryKeywords.length === 0) {
      return [];
    }

    // Score each chunk by keyword match frequency
    const scores: { index: number; score: number }[] = [];

    for (let i = 0; i < this.chunks.length; i++) {
      let score = 0;
      const chunkContent = this.chunks[i].content.toLowerCase();
      const chunkTitle = this.chunks[i].title.toLowerCase();
      const chunkTags = this.chunks[i].tags;

      for (const keyword of queryKeywords) {
        // Check keyword index for fast lookup
        const matchingIndices = this.keywordIndex.get(keyword) || [];

        if (matchingIndices.includes(i)) {
          // Direct hit via index - assign higher score
          score += 3;
        }

        // Bonus for title matches
        if (chunkTitle.includes(keyword)) {
          score += 5;
        }

        // Bonus for tag matches
        if (chunkTags.some((tag) => tag.includes(keyword))) {
          score += 4;
        }

        // Count occurrences in content
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = chunkContent.match(regex);
        if (matches) {
          score += Math.min(matches.length, 5); // Cap at 5 per keyword
        }
      }

      if (score > 0) {
        scores.push({ index: i, score });
      }
    }

    // Sort by score descending and take topK
    scores.sort((a, b) => b.score - a.score);
    const topResults = scores.slice(0, topK);

    return topResults.map((r) => this.chunks[r.index]);
  }

  /**
   * Format chunks as a context string for LLM prompt inclusion.
   */
  formatContext(chunks: KnowledgeChunk[]): string {
    if (!chunks || chunks.length === 0) {
      return '';
    }

    const parts: string[] = ['\n[知识库参考]'];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      parts.push(`\n来源: ${chunk.source.replace(/\.md$/, '')}`);
      parts.push(`领域: ${chunk.title}`);
      parts.push(`内容: ${chunk.content}`);
      if (i < chunks.length - 1) {
        parts.push('---');
      }
    }

    parts.push('\n[请基于以上知识库内容回答用户问题。如果知识库内容与问题不相关，请忽略知识库内容。回答时请注明信息来源。]');

    return parts.join('\n');
  }

  /**
   * Build the keyword inverted index from all chunks.
   */
  private buildIndex(): void {
    this.keywordIndex.clear();

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const keywords = new Set([
        ...this.extractKeywords(chunk.title),
        ...this.extractKeywords(chunk.content),
        ...chunk.tags.map((t) => t.toLowerCase()),
      ]);

      for (const keyword of keywords) {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, []);
        }
        this.keywordIndex.get(keyword)!.push(i);
      }
    }

    this.logger.debug(
      `Built keyword index with ${this.keywordIndex.size} unique keywords`,
    );
  }

  /**
   * Extract Chinese keywords from text.
   * Strategy:
   * 1. Split by punctuation and whitespace
   * 2. Segment into 2-4 character Chinese substrings
   * 3. Also include 2-gram sliding windows for better coverage
   * 4. Remove stop words and numbers
   */
  public extractKeywords(text: string): string[] {
    const keywords = new Set<string>();
    const cleanText = text.toLowerCase().replace(/[a-zA-Z]{1,2}\b/g, ''); // Remove short English words

    // Extract Chinese character sequences (2-6 chars)
    // First get all Chinese segments
    const chineseParts: string[] = [];

    // Split by punctuation, whitespace, English characters
    const segments = cleanText.split(/[\s,，。.、：:；;！!？?()（）【】\[\]""''《》<>/\n\r\t]+/);

    for (const segment of segments) {
      // Extract consecutive Chinese characters
      const chineseMatches = segment.match(/[\u4e00-\u9fff]+/g) || [];
      for (const match of chineseMatches) {
        if (match.length >= 2) {
          chineseParts.push(match);
        }
      }
    }

    // Add each Chinese segment as a keyword (if not stop word)
    for (const part of chineseParts) {
      if (!this.stopWords.has(part)) {
        keywords.add(part);
      }
    }

    // Generate sliding 2-grams for longer sequences (>4 chars)
    for (const part of chineseParts) {
      if (part.length > 4) {
        for (let i = 0; i < part.length - 1; i++) {
          const bigram = part.slice(i, i + 2);
          if (!this.stopWords.has(bigram)) {
            keywords.add(bigram);
          }
        }
      }
    }

    // Also extract 2-4 char substrings from multi-char segments
    for (const part of chineseParts) {
      if (part.length >= 4 && part.length <= 6) {
        keywords.add(part); // Keep the whole segment too
      }
    }

    // Remove any remaining stop words or very short keywords
    const result: string[] = [];
    for (const kw of keywords) {
      if (kw.length >= 2 && kw.length <= 20 && !this.stopWords.has(kw)) {
        result.push(kw);
      }
    }

    return result;
  }

  /**
   * Get total chunk count.
   */
  getChunkCount(): number {
    return this.chunks.length;
  }

  /**
   * Get number of unique source files.
   */
  private getSourceCount(): number {
    const sources = new Set(this.chunks.map((c) => c.source));
    return sources.size;
  }
}
