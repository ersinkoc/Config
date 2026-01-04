import { CodeBlockIDE } from '../code/CodeBlockIDE';

export function QuickStart() {
  const basicCode = `import { loadConfig } from '@oxog/config';

// Load configuration
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  env: process.env.NODE_ENV || 'development',
});

// Access values
const port = config.get('port');
const dbHost = config.get('database.host');

// Type-safe access
interface AppConfig {
  port: number;
  database: { host: string; port: number };
}

const typedConfig = await loadConfig<AppConfig>({ name: 'myapp' });
const port: number = typedConfig.get('port');`;

  const yamlConfig = `port: 3000
database:
  host: localhost
  port: 5432
  name: myapp

server:
  plugins:
    - auth
    - cors`;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Quick Start</h2>
        <p className="text-xl text-muted-foreground">
          Get up and running in seconds
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h3 className="text-2xl font-semibold mb-4">1. Install</h3>
          <CodeBlockIDE
            code="npm install @oxog/config"
            language="bash"
            filename="terminal"
            showLineNumbers={false}
          />
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-4">2. Create a config file</h3>
          <CodeBlockIDE
            code={yamlConfig}
            language="yaml"
            filename="config.yaml"
          />
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-4">3. Load and use</h3>
          <CodeBlockIDE
            code={basicCode}
            language="typescript"
            filename="app.ts"
          />
        </div>
      </div>
    </section>
  );
}
