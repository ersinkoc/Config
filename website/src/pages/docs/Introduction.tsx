import { CodeBlockIDE } from '../../components/code/CodeBlockIDE';
import { Link } from 'react-router-dom';

export function Introduction() {
  return (
    <div className="py-12 max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Introduction</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          @oxog/config is a zero-dependency configuration loader with multi-format support,
          environment merging, and plugin-based extensibility. Built for modern applications
          that need flexible, type-safe configuration management.
        </p>

        {/* Motivation */}
        <h2>Motivation</h2>
        <p>
          Configuration management is a fundamental part of every application, yet most solutions
          either lack features or come with heavy dependencies. We built @oxog/config to solve this:
        </p>
        <ul>
          <li><strong>No dependency bloat:</strong> dotenv is minimal but limited; config pulls in dependencies; convict adds validation but with overhead</li>
          <li><strong>One library, all formats:</strong> Instead of using dotenv + js-yaml + toml-parser, use a single unified solution</li>
          <li><strong>Production-ready:</strong> Built-in encryption, validation, and hot-reload without additional packages</li>
          <li><strong>TypeScript-first:</strong> Full type inference and type-safe access, not just type definitions bolted on</li>
        </ul>

        {/* Key Features */}
        <h2>Key Features</h2>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-2">Zero Dependencies</h3>
            <p className="text-sm text-muted-foreground">
              No runtime dependencies. Everything is implemented from scratch in pure TypeScript.
              Your bundle stays small and your security footprint stays minimal.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-2">Multi-Format Support</h3>
            <p className="text-sm text-muted-foreground">
              JSON, YAML, TOML, INI, and ENV formats all work out of the box with automatic
              format detection based on file extension.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-2">Environment Merging</h3>
            <p className="text-sm text-muted-foreground">
              Automatically merge base configuration with environment-specific overrides.
              config.yaml + config.production.yaml = production config.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-2">Plugin Architecture</h3>
            <p className="text-sm text-muted-foreground">
              Micro-kernel design with a minimal core. All functionality is provided through
              plugins that you can enable, disable, or replace.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-2">Type Safety</h3>
            <p className="text-sm text-muted-foreground">
              Full TypeScript support with generic type inference. Define your config interface
              and get compile-time type checking on all access.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-2">Hot Reload</h3>
            <p className="text-sm text-muted-foreground">
              Watch configuration files for changes and automatically reload. Get notified
              of changes through events so you can react accordingly.
            </p>
          </div>
        </div>

        {/* Architecture */}
        <h2>Architecture</h2>
        <p>
          @oxog/config follows a micro-kernel architecture. The kernel is minimal and handles only the
          essentials: plugin management, event bus, and lifecycle. Everything else is a plugin.
        </p>

        <CodeBlockIDE
          code={`┌─────────────────────────────────────────────────────────────────┐
│                         User Application                         │
├─────────────────────────────────────────────────────────────────┤
│                       Config Instance API                        │
│        get() · set() · has() · delete() · watch() · reload()    │
├─────────────────────────────────────────────────────────────────┤
│                        Plugin Registry                           │
│           use() · register() · unregister() · list()            │
├──────────┬──────────┬──────────┬──────────┬────────────────────┤
│  JSON    │  YAML    │  TOML    │  INI     │  ENV Parser        │
│  Parser  │  Parser  │  Parser  │  Parser  │  + Env Vars        │
├──────────┴──────────┴──────────┴──────────┴────────────────────┤
│                      Optional Plugins                            │
│    Validation · Encryption · Interpolation · Watch · Cache     │
├─────────────────────────────────────────────────────────────────┤
│                        Micro Kernel                              │
│        Event Bus · Lifecycle · Error Boundary · Deep Merge      │
└─────────────────────────────────────────────────────────────────┘`}
          language="text"
          filename="architecture.txt"
          showLineNumbers={false}
        />

        <h3>Core Components</h3>
        <ul>
          <li>
            <strong>Micro Kernel:</strong> The foundation that manages plugin lifecycle, provides the event bus
            for inter-plugin communication, and handles error boundaries.
          </li>
          <li>
            <strong>Plugin Registry:</strong> Manages plugin registration, ordering (via priority), and provides
            hooks for plugins to interact with the configuration lifecycle.
          </li>
          <li>
            <strong>Config Instance:</strong> The public API you interact with. Provides methods to access,
            modify, and watch configuration values.
          </li>
          <li>
            <strong>Parsers:</strong> Each file format has its own parser plugin. Parsers are automatically
            selected based on file extension.
          </li>
        </ul>

        {/* How It Works */}
        <h2>How It Works</h2>
        <p>When you call <code>loadConfig()</code>, the following happens:</p>

        <ol>
          <li><strong>Initialize Kernel:</strong> Create the micro-kernel with event bus and plugin registry</li>
          <li><strong>Register Plugins:</strong> Load core plugins (parsers, merge) and user-specified plugins</li>
          <li><strong>Discover Files:</strong> Find configuration files matching the specified paths and patterns</li>
          <li><strong>Parse Files:</strong> Each file is parsed by its corresponding format plugin</li>
          <li><strong>Environment Merge:</strong> If an environment is specified, merge environment-specific configs</li>
          <li><strong>Apply Defaults:</strong> Merge with default values (lowest priority)</li>
          <li><strong>Plugin Processing:</strong> Each plugin's <code>onLoad</code> hook processes the configuration</li>
          <li><strong>Return Instance:</strong> Return the Config instance with all methods ready to use</li>
        </ol>

        <CodeBlockIDE
          code={`// The loading process
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],           // 1. Discover files
  env: 'production',                   // 2. Environment for merging
  environments: ['dev', 'production'], // 3. Valid environments
  defaults: { port: 3000 },           // 4. Default values
  plugins: [validationPlugin(...)],   // 5. Custom plugins
});

// Resolution order (highest priority first):
// 1. Environment variables (if envPrefix set)
// 2. config.production.yaml (environment-specific)
// 3. config.yaml (base config)
// 4. defaults`}
          language="typescript"
          filename="loading-process.ts"
        />

        {/* Built-in Implementations */}
        <h2>What We Built From Scratch</h2>
        <p>
          Unlike other configuration libraries that rely on external dependencies, we implemented
          everything from scratch to keep the bundle small and secure:
        </p>

        <ul>
          <li>
            <strong>YAML Parser:</strong> Full YAML 1.2 support including anchors, aliases, multi-line strings,
            and complex nested structures. No js-yaml dependency.
          </li>
          <li>
            <strong>TOML Parser:</strong> Complete TOML 1.0 support with tables, arrays of tables, inline tables,
            and all value types. No @iarna/toml dependency.
          </li>
          <li>
            <strong>INI Parser:</strong> Standard INI format with sections, values, and comment support.
          </li>
          <li>
            <strong>ENV Parser:</strong> Dotenv-compatible parser with quote handling, multiline values,
            and variable expansion.
          </li>
          <li>
            <strong>Deep Merge:</strong> Intelligent deep merge with configurable strategies for objects,
            arrays, and specific paths. No lodash.merge dependency.
          </li>
          <li>
            <strong>File Watcher:</strong> Native fs.watch-based file watching with debouncing and
            error recovery. No chokidar dependency.
          </li>
          <li>
            <strong>AES-256-GCM Encryption:</strong> Secure encryption for sensitive configuration values
            using Node.js crypto module.
          </li>
          <li>
            <strong>JSON Schema Validation:</strong> Built-in JSON Schema draft-07 validation for
            configuration validation. No ajv dependency.
          </li>
        </ul>

        {/* Installation */}
        <h2>Installation</h2>
        <p>Install @oxog/config using your preferred package manager:</p>

        <CodeBlockIDE
          code={`# npm
npm install @oxog/config

# yarn
yarn add @oxog/config

# pnpm
pnpm add @oxog/config`}
          language="bash"
          filename="terminal"
          showLineNumbers={false}
        />

        {/* Quick Start */}
        <h2>Quick Start</h2>
        <p>Here's a minimal example to get you started:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';

// Define your config type (optional but recommended)
interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
  };
}

// Load configuration
const config = await loadConfig<AppConfig>({
  name: 'myapp',
  paths: ['./config.yaml'],
  env: process.env.NODE_ENV || 'development',
});

// Access values with dot notation
const port = config.get('port');
const dbHost = config.get('database.host');

// With default values
const timeout = config.get('server.timeout', 5000);

// Check existence
if (config.has('database')) {
  console.log('Database configured!');
}

console.log(\`Server starting on port \${port}...\`);`}
          language="typescript"
          filename="app.ts"
        />

        <p>
          Create a <code>config.yaml</code> file:
        </p>

        <CodeBlockIDE
          code={`port: 3000

database:
  host: localhost
  port: 5432
  name: myapp_db

server:
  timeout: 30000`}
          language="yaml"
          filename="config.yaml"
        />

        {/* Next Steps */}
        <h2>Next Steps</h2>
        <p>Now that you understand the basics, explore these topics:</p>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          <Link
            to="/docs/installation"
            className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <h3 className="font-semibold mb-2">Installation Guide</h3>
            <p className="text-sm text-muted-foreground">
              Detailed installation instructions and TypeScript configuration.
            </p>
          </Link>
          <Link
            to="/api"
            className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <h3 className="font-semibold mb-2">API Reference</h3>
            <p className="text-sm text-muted-foreground">
              Complete API documentation with all methods and options.
            </p>
          </Link>
          <Link
            to="/examples"
            className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <h3 className="font-semibold mb-2">Examples</h3>
            <p className="text-sm text-muted-foreground">
              Real-world examples from Express.js servers to encrypted secrets.
            </p>
          </Link>
          <Link
            to="/playground"
            className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <h3 className="font-semibold mb-2">Playground</h3>
            <p className="text-sm text-muted-foreground">
              Try the parsers interactively in your browser.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
