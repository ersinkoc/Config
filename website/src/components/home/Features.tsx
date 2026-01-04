import { FileText, Layers, Puzzle, Shield, Zap, Settings } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Multi-Format Support',
    description: 'Load configurations in JSON, YAML, TOML, INI, and ENV formats with automatic detection',
  },
  {
    icon: Layers,
    title: 'Environment Merging',
    description: 'Intelligent environment-based overrides with configurable resolution order',
  },
  {
    icon: Puzzle,
    title: 'Plugin Architecture',
    description: 'Micro-kernel plugin system for extensibility and modular loading',
  },
  {
    icon: Settings,
    title: 'Deep Merging',
    description: 'Flexible merge strategies with support for replace, merge, append, and unique operations',
  },
  {
    icon: Zap,
    title: 'Hot Reload',
    description: 'Watch configuration files for changes and automatically reload with event notifications',
  },
  {
    icon: Shield,
    title: 'Type Safety',
    description: 'Full TypeScript support with generic type inference for type-safe configuration access',
  },
];

export function Features() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A powerful, flexible configuration loader designed for modern applications
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
