import { CodeBlock } from '@oxog/codeshine/react';
import { useTheme } from '../../hooks/useTheme';
import { CopyButton } from '../common/CopyButton';

interface CodeBlockIDEProps {
  code: string;
  language: string;
  filename?: string;
  highlightLines?: number[];
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
}

export function CodeBlockIDE({
  code,
  language,
  filename,
  highlightLines,
  showLineNumbers = true,
  showCopyButton = true,
}: CodeBlockIDEProps) {
  const { resolvedTheme } = useTheme();
  const codeTheme = resolvedTheme === 'dark' ? 'github-dark' : 'github-light';

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card shadow-lg my-4">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>
          {filename && (
            <span className="text-sm text-muted-foreground font-mono">
              {filename}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {language}
          </span>
          {showCopyButton && <CopyButton code={code} />}
        </div>
      </div>

      <div className="overflow-x-auto">
        <CodeBlock
          code={code.trim()}
          language={language}
          theme={codeTheme}
          lineNumbers={showLineNumbers}
          highlightLines={highlightLines}
        />
      </div>
    </div>
  );
}
