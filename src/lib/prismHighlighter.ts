import Prism from 'prismjs';

// Common programming language grammars for Prism
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function highlightCode(code: string, language: string): string {
  if (!code) return '';
  const lang = (language || '').toLowerCase().trim();

  // Language mapping aliases
  const langMap: Record<string, string> = {
    js: 'javascript',
    javascript: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    py: 'python',
    python: 'python',
    sh: 'bash',
    bash: 'bash',
    shell: 'bash',
    zsh: 'bash',
    json: 'json',
    css: 'css',
    html: 'markup',
    xml: 'markup',
    md: 'markdown',
    markdown: 'markdown',
    sql: 'sql',
    yaml: 'yaml',
    yml: 'yaml',
    rust: 'rust',
    rs: 'rust',
    go: 'go',
    golang: 'go',
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
  };

  const targetLang = langMap[lang] || lang;
  const grammar = Prism.languages[targetLang] || Prism.languages.javascript || Prism.languages.clike;

  if (grammar) {
    try {
      return Prism.highlight(code, grammar, targetLang);
    } catch (err) {
      console.warn("Prism highlight error:", err);
      return escapeHtml(code);
    }
  }

  return escapeHtml(code);
}
