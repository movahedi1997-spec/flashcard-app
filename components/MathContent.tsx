'use client';

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  text: string;
  className?: string;
  block?: boolean;
}

/**
 * Renders plain text with inline ($...$) and block ($$...$$) LaTeX support.
 * Falls back to plain text if KaTeX throws on a segment.
 */
export default function MathContent({ text, className, block }: Props) {
  const parts = useMemo(() => parseMath(text), [text]);

  if (parts.every((p) => p.type === 'text')) {
    return <span className={className}>{text}</span>;
  }

  const Tag = block ? 'div' : 'span';

  return (
    <Tag className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') return <span key={i}>{part.value}</span>;

        let html = '';
        try {
          html = katex.renderToString(part.value, {
            displayMode: part.type === 'block',
            throwOnError: false,
            output: 'html',
          });
        } catch {
          return <span key={i}>{part.raw}</span>;
        }

        return (
          <span
            key={i}
            className={part.type === 'block' ? 'block my-2 overflow-x-auto' : 'inline'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Tag>
  );
}

type Part =
  | { type: 'text'; value: string }
  | { type: 'inline' | 'block'; value: string; raw: string };

function parseMath(text: string): Part[] {
  const parts: Part[] = [];
  let i = 0;

  while (i < text.length) {
    // Block math: $$...$$
    if (text[i] === '$' && text[i + 1] === '$') {
      const end = text.indexOf('$$', i + 2);
      if (end !== -1) {
        const value = text.slice(i + 2, end);
        parts.push({ type: 'block', value, raw: text.slice(i, end + 2) });
        i = end + 2;
        continue;
      }
    }

    // Inline math: $...$
    if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end !== -1 && end > i + 1) {
        const value = text.slice(i + 1, end);
        // Only treat as math if it doesn't look like a currency value (no spaces before digits)
        if (!/^\d/.test(value) || value.includes('\\') || value.includes('^') || value.includes('_')) {
          parts.push({ type: 'inline', value, raw: text.slice(i, end + 1) });
          i = end + 1;
          continue;
        }
      }
    }

    // Accumulate plain text
    const lastPart = parts[parts.length - 1];
    if (lastPart?.type === 'text') {
      lastPart.value += text[i];
    } else {
      parts.push({ type: 'text', value: text[i] });
    }
    i++;
  }

  return parts;
}
