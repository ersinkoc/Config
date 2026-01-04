import type { ReactNode } from 'react';
import { DocsSidebar } from './DocsSidebar';

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-12">
        <DocsSidebar />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
