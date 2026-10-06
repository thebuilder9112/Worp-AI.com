export interface CustomCommand {
  id: string;
  name: string;        // Trigger, e.g. "/explain" or "/refactor"
  description: string; // Brief description
  prompt: string;      // Simple English instruction / template
  isPreset?: boolean;
  createdAt: string;
}

export const DEFAULT_COMMANDS: CustomCommand[] = [
  {
    id: 'preset-explain',
    name: '/explain',
    description: 'Explain in plain English with breakdown',
    prompt: 'Explain the following code, concept, or query in clear, simple English. Break down the logic step-by-step with practical examples and analogies.',
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-refactor',
    name: '/refactor',
    description: 'Clean, modular & typed refactor',
    prompt: 'Refactor the following code to adhere to clean code principles, best architecture patterns, type safety, and optimal runtime performance. Provide clean diffs and explanations.',
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-test',
    name: '/test',
    description: 'Generate comprehensive unit tests',
    prompt: 'Write comprehensive, production-grade unit and integration tests for this code covering happy paths, edge cases, error conditions, and mocks.',
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-summarize',
    name: '/summarize',
    description: '3-point executive briefing',
    prompt: 'Summarize the following topic or conversation into a crisp 3-point executive briefing with key decisions and actionable next steps.',
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-fix',
    name: '/fix',
    description: 'Diagnose root cause & provide fix',
    prompt: 'Thoroughly diagnose the error, bug, or issue in the following code. Identify the root cause and provide the corrected code with explanation.',
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'preset-security',
    name: '/security',
    description: 'Vulnerability & hardening audit',
    prompt: 'Perform an exhaustive security and safety audit on the following code. Point out vulnerabilities (OWASP, injection, memory, auth flaws) and provide hardened production-ready patches.',
    isPreset: true,
    createdAt: new Date().toISOString()
  }
];

export const INSPIRATION_TEMPLATES = [
  {
    name: '/eli5',
    title: 'Explain Like I\'m 5',
    description: 'Explain complex concepts in simple childlike terms',
    prompt: 'Explain the following topic, code, or question as if I were a 5-year-old. Use everyday metaphors, zero jargon, and warm conversational tone.'
  },
  {
    name: '/roast',
    title: 'Code Roast',
    description: 'Brutally witty yet constructive code critique',
    prompt: 'Brutally and humorously roast this code or design. Point out every antipattern, shortcut, and aesthetic crime, then give constructive remedies.'
  },
  {
    name: '/translate-es',
    title: 'Spanish Translator',
    description: 'Translate text accurately into Spanish',
    prompt: 'Translate the provided text into natural, fluent Spanish. Maintain formatting, tone, and technical terminology accuracy.'
  },
  {
    name: '/pr-review',
    title: 'Pull Request Reviewer',
    description: 'Staff-engineer level PR review',
    prompt: 'Conduct a thorough pull request code review. Analyze architecture, edge cases, performance bottlenecks, naming conventions, and test coverage.'
  },
  {
    name: '/docs',
    title: 'Documentation Generator',
    description: 'Generate comprehensive Markdown & JSDoc',
    prompt: 'Generate clear, complete developer documentation for this code, including Markdown README sections, API parameter tables, and JSDoc annotations.'
  },
  {
    name: '/mockdata',
    title: 'Realistic Mock Data',
    description: 'Generate JSON mock dataset',
    prompt: 'Generate 10 realistic, diversified mock data records in JSON format matching the schema or domain described below.'
  },
  {
    name: '/compare',
    title: 'Multi-Item Comparison',
    description: 'Compare all attached items side-by-side',
    prompt: 'Examine all attached items, images, or snippets. Provide a side-by-side comparative analysis of differences, trade-offs, pros, cons, and recommend the best option.'
  },
  {
    name: '/batch',
    title: 'Batch Analysis',
    description: 'Exhaustive audit of all attached items',
    prompt: 'Process and analyze all attached items and resources in a structured batch report, noting key takeaways, interdependencies, and insights for each item.'
  }
];

const STORAGE_KEY = 'worp_custom_commands';

export function loadStoredCommands(): CustomCommand[] {
  if (typeof window === 'undefined') return DEFAULT_COMMANDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COMMANDS));
      return DEFAULT_COMMANDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_COMMANDS;
  } catch (err) {
    console.warn("Failed loading custom commands:", err);
    return DEFAULT_COMMANDS;
  }
}

export function saveStoredCommands(commands: CustomCommand[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  } catch (err) {
    console.warn("Failed saving custom commands:", err);
  }
}

/**
 * Checks if a command string is an inline command creation request.
 * Supports both explicit commands:
 *   /createcommand /eli5 Explain like I am 5
 *   /create /audit Audit code
 *   /newcmd /test Write tests
 * AND plain natural English commands in the prompt:
 *   create command /review: analyze code style and performance
 *   make a command /summary to summarize into 3 bullets
 *   add command /roast that roasts my code
 *   new command \notes - extract key meeting points
 *   define command called /interview: ask technical interview questions
 */
export function parseCommandCreation(input: string): { name: string; prompt: string; description?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Explicit slash trigger: /createcommand, /create-command, /newcmd, /cmd, /create, /setcommand, /custom
  const slashRegex = /^\s*(?:\/|\\)(?:createcommand|create-command|newcmd|cmd|create|setcommand|custom)\s+([\/\\a-zA-Z0-9_\-]+)\s+([\s\S]+)$/i;
  const slashMatch = slashRegex.exec(trimmed);
  if (slashMatch) {
    let rawName = slashMatch[1].trim();
    if (!rawName.startsWith('/') && !rawName.startsWith('\\')) {
      rawName = '/' + rawName;
    }
    const prompt = slashMatch[2].trim();
    if (prompt) {
      return { 
        name: rawName, 
        prompt,
        description: prompt.length > 55 ? prompt.substring(0, 52) + '...' : prompt
      };
    }
  }

  // 2. Natural English phrases:
  // Examples:
  // "create command /review: analyze code"
  // "make a command /eli5: explain like I'm 5"
  // "add command /summary to summarize..."
  // "new command \audit - check security"
  // "define command called /notes that..."
  // "please create a command /clean to..."
  const naturalRegex = /^(?:please\s+)?(?:create|make|add|new|define|register|build)\s+(?:a\s+)?(?:new\s+)?command\s+(?:called\s+|named\s+)?([\/\\a-zA-Z0-9_\-]+)(?:\s*[:\-–—]\s*|\s+(?:to|that|which|for)\s+|\s+)([\s\S]+)$/i;
  const naturalMatch = naturalRegex.exec(trimmed);
  if (naturalMatch) {
    let rawName = naturalMatch[1].trim();
    if (!rawName.startsWith('/') && !rawName.startsWith('\\')) {
      rawName = '/' + rawName;
    }
    let prompt = naturalMatch[2].trim();
    // Strip leading punctuation like colon or dash if captured
    prompt = prompt.replace(/^[:\-–—\s]+/, '').trim();
    if (prompt && rawName.length > 1) {
      return {
        name: rawName,
        prompt,
        description: prompt.length > 55 ? prompt.substring(0, 52) + '...' : prompt
      };
    }
  }

  // 3. Natural English without trigger specified:
  // "create a command that explains code like a 5 year old"
  // "make a command to summarize text into 3 bullets"
  const generalNaturalRegex = /^(?:please\s+)?(?:create|make|add|build)\s+(?:a\s+)?(?:new\s+)?command\s+(?:to|that|which)\s+([\s\S]+)$/i;
  const generalMatch = generalNaturalRegex.exec(trimmed);
  if (generalMatch) {
    const rawInstruction = generalMatch[1].trim();
    if (rawInstruction.length > 4) {
      const generated = generateCommandFromNaturalLanguage(rawInstruction);
      return {
        name: generated.name,
        prompt: generated.prompt,
        description: generated.description
      };
    }
  }

  return null;
}

/**
 * Turns any simple English sentence into a structured CustomCommand
 * e.g. "a command that reviews my pull requests and checks for typescript errors"
 */
export function generateCommandFromNaturalLanguage(description: string): { name: string; description: string; prompt: string } {
  const clean = description.trim();
  const lower = clean.toLowerCase();

  // Pattern detection for smart trigger names
  let name = '/custom';
  let title = clean.length > 50 ? clean.substring(0, 48) + '...' : clean;

  if (lower.includes('eli5') || lower.includes('5 year') || lower.includes('simple terms') || lower.includes('child')) {
    name = '/eli5';
    title = 'Explain like I am 5 years old';
  } else if (lower.includes('test') || lower.includes('unit test') || lower.includes('vitest') || lower.includes('jest')) {
    name = '/test';
    title = 'Generate comprehensive unit tests';
  } else if (lower.includes('summar') || lower.includes('brief') || lower.includes('tldr')) {
    name = '/summarize';
    title = 'Concise executive summary';
  } else if (lower.includes('refactor') || lower.includes('clean up') || lower.includes('modular')) {
    name = '/refactor';
    title = 'Clean code refactor';
  } else if (lower.includes('review') || lower.includes('pr') || lower.includes('pull request')) {
    name = '/review';
    title = 'Thorough code review';
  } else if (lower.includes('roast') || lower.includes('critique') || lower.includes('harsh')) {
    name = '/roast';
    title = 'Witty code roast & critique';
  } else if (lower.includes('spanish') || lower.includes('espanol')) {
    name = '/translate-es';
    title = 'Translate to Spanish';
  } else if (lower.includes('translate') || lower.includes('translation')) {
    name = '/translate';
    title = 'Language translation';
  } else if (lower.includes('security') || lower.includes('vulnerab') || lower.includes('audit')) {
    name = '/security';
    title = 'Security & vulnerability audit';
  } else if (lower.includes('doc') || lower.includes('comment') || lower.includes('jsdoc')) {
    name = '/docs';
    title = 'Generate documentation & comments';
  } else if (lower.includes('fix') || lower.includes('debug') || lower.includes('error')) {
    name = '/fix';
    title = 'Diagnose & fix errors';
  } else if (lower.includes('optimize') || lower.includes('perf') || lower.includes('fast')) {
    name = '/optimize';
    title = 'Performance optimization';
  } else {
    // Generate clean slug from first words
    const words = clean
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => !['a', 'an', 'the', 'to', 'that', 'which', 'and', 'or', 'for', 'with', 'command'].includes(w.toLowerCase()))
      .slice(0, 2);
    if (words.length > 0) {
      name = '/' + words.join('-').toLowerCase();
    }
  }

  // Construct a well-crafted simple English prompt
  let prompt = clean;
  if (!clean.toLowerCase().startsWith('please') && !clean.toLowerCase().startsWith('you are') && !clean.toLowerCase().startsWith('act as')) {
    prompt = `Please execute the following directive: ${clean}. Provide high quality, clear, and comprehensive output formatted in clean Markdown.`;
  }

  return {
    name,
    description: title,
    prompt
  };
}

/**
 * Checks if user input starts with any registered custom command
 * e.g. "/refactor function test() {}" or "\refactor function test() {}"
 */
export function findMatchingCustomCommand(input: string, commands: CustomCommand[]): { command: CustomCommand; rest: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const cmd of commands) {
    const trigger = cmd.name.toLowerCase();
    const triggerAlt = trigger.startsWith('/') ? '\\' + trigger.substring(1) : '/' + trigger.substring(1);

    if (
      trimmed.toLowerCase() === trigger ||
      trimmed.toLowerCase() === triggerAlt ||
      trimmed.toLowerCase().startsWith(trigger + ' ') ||
      trimmed.toLowerCase().startsWith(triggerAlt + ' ')
    ) {
      const rest = trimmed.substring(trigger.length).trim();
      return { command: cmd, rest };
    }
  }
  return null;
}
