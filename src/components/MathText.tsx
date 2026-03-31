import katex from 'katex';

interface Props {
  text: string;
  className?: string;
}

/**
 * Renders text with inline math ($...$) and block math ($$...$$).
 * Non-math text is rendered as-is.
 */
export function MathText({ text, className }: Props) {
  const html = renderMathInText(text);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Split text into segments of plain text and math, render math with KaTeX
function renderMathInText(text: string): string {
  // First handle block math ($$...$$), then inline ($...$)
  // Use a regex that captures both, processing $$ before $
  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for block math first
    const blockMatch = remaining.match(/\$\$([\s\S]+?)\$\$/);
    const inlineMatch = remaining.match(/\$([^\$\n]+?)\$/);

    if (!blockMatch && !inlineMatch) {
      parts.push(escapeHtml(remaining));
      break;
    }

    // Pick whichever comes first
    const blockIdx = blockMatch ? remaining.indexOf(blockMatch[0]) : Infinity;
    const inlineIdx = inlineMatch ? remaining.indexOf(inlineMatch[0]) : Infinity;

    if (blockIdx <= inlineIdx && blockMatch) {
      // Add text before the match
      if (blockIdx > 0) parts.push(escapeHtml(remaining.slice(0, blockIdx)));
      // Render block math
      try {
        parts.push(katex.renderToString(blockMatch[1].trim(), { displayMode: true, throwOnError: false }));
      } catch {
        parts.push(escapeHtml(blockMatch[0]));
      }
      remaining = remaining.slice(blockIdx + blockMatch[0].length);
    } else if (inlineMatch) {
      // Add text before the match
      if (inlineIdx > 0) parts.push(escapeHtml(remaining.slice(0, inlineIdx)));
      // Render inline math
      try {
        parts.push(katex.renderToString(inlineMatch[1].trim(), { displayMode: false, throwOnError: false }));
      } catch {
        parts.push(escapeHtml(inlineMatch[0]));
      }
      remaining = remaining.slice(inlineIdx + inlineMatch[0].length);
    }
  }

  return parts.join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
