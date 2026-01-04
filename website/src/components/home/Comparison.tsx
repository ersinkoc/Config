import { Check, X, Minus } from 'lucide-react';

const features = [
  { name: 'Zero Dependencies', oxog: true, dotenv: true, config: false, convict: false },
  { name: 'Multi-format (JSON, YAML, TOML, INI, ENV)', oxog: true, dotenv: false, config: 'partial', convict: false },
  { name: 'Environment Merging', oxog: true, dotenv: false, config: true, convict: true },
  { name: 'TypeScript Native', oxog: true, dotenv: false, config: false, convict: false },
  { name: 'Plugin System', oxog: true, dotenv: false, config: false, convict: false },
  { name: 'Hot Reload / File Watching', oxog: true, dotenv: false, config: false, convict: false },
  { name: 'Schema Validation', oxog: true, dotenv: false, config: false, convict: true },
  { name: 'Encrypted Secrets', oxog: true, dotenv: false, config: false, convict: false },
  { name: 'Variable Interpolation', oxog: true, dotenv: 'partial', config: false, convict: false },
  { name: 'Deep Merge Strategies', oxog: true, dotenv: false, config: true, convict: false },
  { name: 'Bundle Size < 5KB', oxog: true, dotenv: true, config: false, convict: false },
];

function FeatureIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="w-5 h-5 text-green-500" />;
  }
  if (value === false) {
    return <X className="w-5 h-5 text-red-500/60" />;
  }
  return <Minus className="w-5 h-5 text-yellow-500" />;
}

export function Comparison() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Why Choose @oxog/config?</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          See how we compare to other popular configuration libraries
        </p>
      </div>

      <div className="max-w-5xl mx-auto overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 font-semibold">Feature</th>
              <th className="text-center py-4 px-4 font-semibold">
                <span className="text-primary">@oxog/config</span>
              </th>
              <th className="text-center py-4 px-4 font-semibold text-muted-foreground">dotenv</th>
              <th className="text-center py-4 px-4 font-semibold text-muted-foreground">config</th>
              <th className="text-center py-4 px-4 font-semibold text-muted-foreground">convict</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.name}
                className={`border-b border-border ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
              >
                <td className="py-3 px-4 text-sm">{feature.name}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <FeatureIcon value={feature.oxog} />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <FeatureIcon value={feature.dotenv} />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <FeatureIcon value={feature.config} />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <FeatureIcon value={feature.convict} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-6">
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" /> Supported
          </span>
          <span className="flex items-center gap-1">
            <Minus className="w-4 h-4 text-yellow-500" /> Partial
          </span>
          <span className="flex items-center gap-1">
            <X className="w-4 h-4 text-red-500/60" /> Not Supported
          </span>
        </p>
      </div>
    </section>
  );
}
