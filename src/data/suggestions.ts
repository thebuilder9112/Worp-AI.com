export interface SuggestionItem {
  label: string;
  category: 'standard' | 'code' | 'art' | 'research' | 'general';
  iconType: 'sparkles' | 'image' | 'search' | 'code' | 'brain' | 'zap' | 'terminal' | 'palette';
}

export const SUGGESTION_POOL: SuggestionItem[] = [
  // Tech & General
  { label: "Latest tech news & breakthroughs", category: "standard", iconType: "sparkles" },
  { label: "Explain quantum computing in simple terms", category: "standard", iconType: "zap" },
  { label: "Compare microservices vs monolithic architecture", category: "standard", iconType: "terminal" },
  { label: "How do LLMs process attention mechanisms?", category: "standard", iconType: "brain" },
  { label: "Top full-stack web trends in 2026", category: "standard", iconType: "sparkles" },
  { label: "Design a high-throughput caching strategy", category: "standard", iconType: "zap" },
  { label: "Explain zero-knowledge proofs", category: "standard", iconType: "search" },
  
  // Code & Development
  { label: "Write a custom React hook for WebSockets", category: "code", iconType: "code" },
  { label: "Optimize complex PostgreSQL query performance", category: "code", iconType: "terminal" },
  { label: "Design a secure JWT authentication flow", category: "code", iconType: "code" },
  { label: "Create a debounce and throttle utility in TypeScript", category: "code", iconType: "terminal" },
  { label: "Find and fix memory leaks in Node.js", category: "code", iconType: "code" },
  { label: "Build a responsive CSS grid layout", category: "code", iconType: "terminal" },
  { label: "Implement a binary search tree in Rust", category: "code", iconType: "code" },
  { label: "Write unit tests with Vitest & React Testing Library", category: "code", iconType: "terminal" },

  // Creative & Art
  { label: "Show me a photo of a neon cybernetic galaxy", category: "art", iconType: "image" },
  { label: "Minimalist brutalist UI design principles", category: "art", iconType: "palette" },
  { label: "Generate prompt for futuristic architectural rendering", category: "art", iconType: "image" },
  { label: "Impressionist oil painting of Tokyo in rain", category: "art", iconType: "palette" },
  { label: "Modern dark-mode color palette with neon accents", category: "art", iconType: "palette" },
  { label: "Cinematic portrait with volumetric lighting", category: "art", iconType: "image" },
  { label: "Create an isometric 3D game asset concept", category: "art", iconType: "image" },

  // Deep Research & Analysis
  { label: "Analyze black hole information paradox", category: "research", iconType: "brain" },
  { label: "CRISPR gene editing recent clinical trial results", category: "research", iconType: "search" },
  { label: "Economic impact of autonomous AI agent networks", category: "research", iconType: "brain" },
  { label: "Compare Transformer vs State-Space Models (Mamba)", category: "research", iconType: "search" },
  { label: "Recent milestones in fusion energy research", category: "research", iconType: "brain" },
  { label: "Deep dive into solid-state lithium battery tech", category: "research", iconType: "search" },
  { label: "Mathematical proof of Gödel's Incompleteness Theorem", category: "research", iconType: "brain" }
];

/**
 * Returns a randomized subset of suggestions tailored to the active mode.
 */
export function getRandomSuggestions(mode: string = 'standard', count: number = 3): SuggestionItem[] {
  // Filter by matching mode + some general items for freshness
  const relevant = SUGGESTION_POOL.filter(
    item => item.category === mode || item.category === 'standard' || item.category === 'general'
  );

  // Fisher-Yates shuffle
  const shuffled = [...relevant];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
