import { ArrowRight, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CodeBlockIDE } from '../code/CodeBlockIDE';

export function Hero() {
  const installCode = `npm install @oxog/config`;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <span>@oxog/config</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span>Zero-dependency</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Configuration Loader
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Zero-dependency configuration loader with multi-format support, environment merging, and plugin-based extensibility
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <CodeBlockIDE
            code={installCode}
            language="bash"
            filename="terminal"
            showCopyButton={true}
            showLineNumbers={false}
          />
          <Link
            to="/docs/introduction"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/ersinkoc/config"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Zero Dependencies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Multi-format</span>
          </div>
        </div>
      </div>
    </section>
  );
}
