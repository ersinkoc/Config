import { Link } from 'react-router-dom';
import { Menu, Github, Package } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { GitHubStar } from '../common/GitHubStar';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 font-bold text-lg shrink-0">
          <span className="text-primary">@oxog</span>
          <span className="text-foreground">/config</span>
        </Link>

        {/* Navigation - Center */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <Link
            to="/docs/introduction"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            Docs
          </Link>
          <Link
            to="/api"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            API
          </Link>
          <Link
            to="/examples"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            Examples
          </Link>
          <Link
            to="/playground"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            Playground
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <GitHubStar />
          <a
            href="https://github.com/ersinkoc/config"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://www.npmjs.com/package/@oxog/config"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="npm"
          >
            <Package className="w-5 h-5" />
          </a>
          <ThemeToggle />
          <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
