import { Link, useLocation } from 'react-router-dom';
import { Book, Download, Settings, Puzzle, Code, Beaker } from 'lucide-react';

const navItems = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs/introduction', label: 'Introduction', icon: Book },
      { href: '/docs/installation', label: 'Installation', icon: Download },
    ],
  },
  {
    title: 'Guide',
    items: [
      { href: '/docs/configuration', label: 'Configuration', icon: Settings },
      { href: '/docs/plugins', label: 'Plugins', icon: Puzzle },
    ],
  },
  {
    title: 'Reference',
    items: [
      { href: '/api', label: 'API Reference', icon: Code },
      { href: '/examples', label: 'Examples', icon: Book },
      { href: '/playground', label: 'Playground', icon: Beaker },
    ],
  },
];

export function DocsSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="sticky top-20 space-y-8">
        {navItems.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
