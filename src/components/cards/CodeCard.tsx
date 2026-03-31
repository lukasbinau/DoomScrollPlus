import { useEffect, useRef } from 'react';
import type { Card, CodeContent } from '../../types/card';
import { MathText } from '../MathText';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-clike';

interface Props {
  card: Card;
}

export function CodeCard({ card }: Props) {
  const { code, language, explanation } = card.content as CodeContent;
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  const langClass = `language-${language === 'pseudocode' ? 'clike' : language}`;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full bg-cyan-500/20 text-cyan-400">
        Code · {card.subject}
      </span>
      <h2 className="mb-4 text-lg font-bold leading-tight text-center text-white">
        <MathText text={card.title} />
      </h2>

      <div className="w-full max-w-[360px] rounded-xl overflow-hidden border border-white/10">
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.06] border-b border-white/10">
          <span className="text-xs font-mono text-white/40">{language}</span>
        </div>
        <pre className="p-4 overflow-x-auto text-xs leading-relaxed bg-[#0d0d0d] m-0 scrollable-touch">
          <code ref={codeRef} className={langClass}>
            {code}
          </code>
        </pre>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/70 text-center max-w-[340px]">
        <MathText text={explanation} />
      </p>
      <span className="mt-4 text-xs text-white/30">
        {card.source}
      </span>
    </div>
  );
}
