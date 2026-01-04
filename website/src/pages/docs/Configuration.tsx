import { CodeBlockIDE } from '../../components/code/CodeBlockIDE';

export function Configuration() {
  return (
    <div className="py-12 max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Configuration Options</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          Complete guide to all configuration options available in @oxog/config.
          Learn how to customize file loading, environment handling, and more.
        </p>

        {/* LoadOptions */}
        <h2>Load Options</h2>
        <p>
          The <code>loadConfig()</code> function accepts an options object that controls
          how configuration is loaded and processed.
        </p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';

const config = await loadConfig({
  // Required options
  name: 'myapp',

  // File loading
  paths: ['./config.yaml', './config/*.json'],
  cwd: process.cwd(),

  // Environment
  env: process.env.NODE_ENV || 'development',
  environments: ['development', 'staging', 'production'],
  envPrefix: 'MYAPP_',

  // Defaults and validation
  defaults: { port: 3000 },
  required: ['database.host', 'database.port'],

  // Merging
  mergeStrategy: {
    default: 'merge',
    arrays: 'unique',
  },

  // File watching
  watch: true,
  watchOptions: { debounce: 100 },

  // Plugins
  plugins: [],
});`}
          language="typescript"
          filename="load-options.ts"
        />

        {/* name */}
        <h3 id="name">name (required)</h3>
        <p>
          Unique identifier for this configuration instance. Used for caching, logging, and
          to distinguish between multiple config instances.
        </p>

        <CodeBlockIDE
          code={`// Single config
const config = await loadConfig({ name: 'myapp' });

// Multiple configs
const appConfig = await loadConfig({ name: 'app' });
const dbConfig = await loadConfig({ name: 'database' });`}
          language="typescript"
          filename="name-option.ts"
        />

        {/* paths */}
        <h3 id="paths">paths</h3>
        <p>
          Array of file paths or glob patterns to load configuration from.
          Files are loaded in order, with later files overriding earlier ones.
        </p>

        <CodeBlockIDE
          code={`// Single file
paths: ['./config.yaml']

// Multiple files (loaded in order)
paths: [
  './config/base.yaml',
  './config/local.yaml',    // Overrides base
  './config/secrets.yaml',  // Overrides local
]

// Glob patterns
paths: [
  './config/*.yaml',        // All YAML files in config/
  './config/**/*.json',     // All JSON files recursively
]

// Mixed formats
paths: [
  './config.yaml',
  './overrides.json',
  './.env',
]`}
          language="typescript"
          filename="paths-option.ts"
        />

        {/* cwd */}
        <h3 id="cwd">cwd</h3>
        <p>
          Base directory for resolving relative paths. Defaults to <code>process.cwd()</code>.
        </p>

        <CodeBlockIDE
          code={`// Resolve paths relative to a specific directory
const config = await loadConfig({
  name: 'myapp',
  cwd: '/etc/myapp',  // Absolute path
  paths: ['./config.yaml'],  // Resolves to /etc/myapp/config.yaml
});

// Useful for monorepos
const config = await loadConfig({
  name: 'service',
  cwd: path.join(__dirname, '../config'),
  paths: ['./service.yaml'],
});`}
          language="typescript"
          filename="cwd-option.ts"
        />

        {/* env */}
        <h3 id="env">env</h3>
        <p>
          Current environment name. Used to load environment-specific configuration files
          that override the base configuration.
        </p>

        <CodeBlockIDE
          code={`// Set environment
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  env: process.env.NODE_ENV || 'development',
});

// What happens:
// 1. Load ./config.yaml (base config)
// 2. Load ./config.development.yaml (if exists, merges with base)

// File naming convention:
// config.yaml              -> base config
// config.development.yaml  -> development overrides
// config.staging.yaml      -> staging overrides
// config.production.yaml   -> production overrides`}
          language="typescript"
          filename="env-option.ts"
        />

        {/* environments */}
        <h3 id="environments">environments</h3>
        <p>
          List of valid environment names. If specified, an error is thrown when
          an invalid environment is used.
        </p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  env: 'production',
  environments: ['development', 'staging', 'production'],
  // 'production' is valid, proceeds normally
});

// If env: 'test' was used:
// Error: Invalid environment 'test'. Valid: development, staging, production`}
          language="typescript"
          filename="environments-option.ts"
        />

        {/* envPrefix */}
        <h3 id="envprefix">envPrefix</h3>
        <p>
          Prefix for environment variables to include in configuration.
          Environment variables take highest priority and override file values.
        </p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  envPrefix: 'MYAPP_',
});

// Environment variables:
// MYAPP_PORT=8080           -> config.get('port') = 8080
// MYAPP_DATABASE_HOST=db    -> config.get('database.host') = 'db'
// MYAPP_DATABASE_PORT=5433  -> config.get('database.port') = 5433

// Conversion rules:
// - Prefix is stripped
// - Underscores become nested paths
// - Values are parsed (numbers, booleans, JSON)

// Priority (highest first):
// 1. Environment variables (MYAPP_*)
// 2. Environment-specific file (config.production.yaml)
// 3. Base config file (config.yaml)
// 4. Default values`}
          language="typescript"
          filename="envprefix-option.ts"
        />

        {/* defaults */}
        <h3 id="defaults">defaults</h3>
        <p>
          Default values applied before loading files. These have the lowest priority
          and are overridden by any file or environment variable.
        </p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  defaults: {
    port: 3000,
    debug: false,
    database: {
      host: 'localhost',
      port: 5432,
      pool: {
        min: 2,
        max: 10,
      },
    },
    features: ['auth'],
  },
});

// If config.yaml only has:
//   port: 8080
//
// Result:
//   port: 8080 (from file)
//   debug: false (from defaults)
//   database.host: 'localhost' (from defaults)
//   database.port: 5432 (from defaults)
//   ...`}
          language="typescript"
          filename="defaults-option.ts"
        />

        {/* required */}
        <h3 id="required">required</h3>
        <p>
          List of configuration paths that must exist. An error is thrown
          if any required path is missing after all loading and merging.
        </p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  required: [
    'database.host',
    'database.port',
    'database.name',
    'api.key',
  ],
});

// If 'api.key' is missing:
// Error: Missing required configuration: api.key

// Works with nested paths and arrays:
required: [
  'server.port',           // Nested path
  'features.0',            // First array element
  'database.credentials.password', // Deep nesting
]`}
          language="typescript"
          filename="required-option.ts"
        />

        {/* mergeStrategy */}
        <h3 id="mergestrategy">mergeStrategy</h3>
        <p>
          Controls how configurations from multiple sources are merged together.
        </p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: ['./base.yaml', './override.yaml'],
  mergeStrategy: {
    // Default strategy for objects
    default: 'merge',  // 'merge' | 'replace'

    // Strategy for arrays
    arrays: 'unique',  // 'replace' | 'append' | 'prepend' | 'unique'

    // Path-specific strategies (override default)
    paths: {
      'server.plugins': 'append',    // Always append plugins
      'database.hosts': 'replace',   // Replace hosts entirely
      'features': 'unique',          // Merge and deduplicate
      'overwrite': 'replace',        // Complete replacement
    },
  },
});

// Strategy examples:

// replace (default for arrays)
['a', 'b'] + ['c'] = ['c']

// append
['a', 'b'] + ['c'] = ['a', 'b', 'c']

// prepend
['a', 'b'] + ['c'] = ['c', 'a', 'b']

// unique
['a', 'b'] + ['b', 'c'] = ['a', 'b', 'c']

// merge (for objects)
{ a: 1, b: 2 } + { b: 3, c: 4 } = { a: 1, b: 3, c: 4 }`}
          language="typescript"
          filename="mergestrategy-option.ts"
        />

        {/* watch */}
        <h3 id="watch">watch</h3>
        <p>
          Enable file watching to automatically reload configuration when files change.
        </p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  watch: true,
});

// Listen for changes
config.on('reload', () => {
  console.log('Config reloaded!');
});

config.on('change', (event) => {
  console.log(\`\${event.path}: \${event.oldValue} -> \${event.value}\`);
});

// Stop watching when done
config.unwatch();`}
          language="typescript"
          filename="watch-option.ts"
        />

        {/* watchOptions */}
        <h3 id="watchoptions">watchOptions</h3>
        <p>
          Fine-tune file watching behavior.
        </p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: ['./config/*.yaml'],
  watch: true,
  watchOptions: {
    // Debounce delay in milliseconds
    // Prevents multiple reloads during rapid changes
    debounce: 100,

    // Watch for new file creation
    watchCreation: true,

    // Glob patterns to ignore
    ignore: [
      '**/*.bak',
      '**/.git/**',
      '**/node_modules/**',
    ],

    // Use polling instead of native events (slower but more compatible)
    usePolling: false,

    // Polling interval if usePolling is true
    pollInterval: 1000,
  },
});`}
          language="typescript"
          filename="watchoptions-option.ts"
        />

        {/* plugins */}
        <h3 id="plugins">plugins</h3>
        <p>
          Array of plugins to extend functionality. Plugins are executed in priority order.
        </p>

        <CodeBlockIDE
          code={`import { validationPlugin, encryptionPlugin } from '@oxog/config/plugins';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [
    // Validation plugin (validates on load)
    validationPlugin({
      schema: myJsonSchema,
      strict: true,
    }),

    // Encryption plugin (decrypts sensitive values)
    encryptionPlugin({
      secretKey: process.env.CONFIG_KEY,
      paths: ['database.password'],
    }),

    // Custom plugin
    {
      name: 'my-plugin',
      onLoad(data) {
        console.log('Config loaded!');
        return data;
      },
    },
  ],
});`}
          language="typescript"
          filename="plugins-option.ts"
        />

        {/* Config File Formats */}
        <h2>Configuration File Formats</h2>
        <p>
          @oxog/config automatically detects file format based on extension.
          All formats are parsed with custom zero-dependency implementations.
        </p>

        <div className="not-prose my-8">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Extension</th>
                <th className="border border-border px-4 py-2 text-left">Format</th>
                <th className="border border-border px-4 py-2 text-left">Features</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2"><code>.json</code></td>
                <td className="border border-border px-4 py-2">JSON</td>
                <td className="border border-border px-4 py-2">Standard JSON with comments (JSONC)</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>.yaml</code>, <code>.yml</code></td>
                <td className="border border-border px-4 py-2">YAML 1.2</td>
                <td className="border border-border px-4 py-2">Anchors, aliases, multi-line strings</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>.toml</code></td>
                <td className="border border-border px-4 py-2">TOML 1.0</td>
                <td className="border border-border px-4 py-2">Tables, arrays of tables, inline tables</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>.ini</code></td>
                <td className="border border-border px-4 py-2">INI</td>
                <td className="border border-border px-4 py-2">Sections, key-value pairs</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>.env</code></td>
                <td className="border border-border px-4 py-2">dotenv</td>
                <td className="border border-border px-4 py-2">Quotes, multiline, variable expansion</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Environment Variable Parsing */}
        <h2>Environment Variable Parsing</h2>
        <p>
          When using <code>envPrefix</code>, environment variables are automatically
          parsed into appropriate types.
        </p>

        <CodeBlockIDE
          code={`# Environment variables
MYAPP_PORT=3000              # -> number: 3000
MYAPP_DEBUG=true             # -> boolean: true
MYAPP_NAME=myapp             # -> string: 'myapp'
MYAPP_HOSTS=["a","b"]        # -> array: ['a', 'b']
MYAPP_CONFIG={"k":"v"}       # -> object: { k: 'v' }
MYAPP_DATABASE_HOST=db       # -> nested: database.host = 'db'
MYAPP_DATABASE_PORT=5432     # -> nested: database.port = 5432

# Access in code
config.get('port');           // 3000 (number)
config.get('debug');          // true (boolean)
config.get('database.host');  // 'db' (string)
config.get('hosts');          // ['a', 'b'] (array)`}
          language="bash"
          filename="env-parsing.txt"
        />

        {/* File Resolution Order */}
        <h2>File Resolution Order</h2>
        <p>
          Configuration is loaded and merged in a specific order. Later sources
          override earlier ones.
        </p>

        <CodeBlockIDE
          code={`// Given this configuration:
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  env: 'production',
  envPrefix: 'MYAPP_',
  defaults: { port: 3000 },
});

// Resolution order (lowest to highest priority):
// 1. defaults                      { port: 3000 }
// 2. config.yaml                   { port: 8080, db: 'localhost' }
// 3. config.production.yaml        { db: 'prod.example.com' }
// 4. environment variables         MYAPP_PORT=9000

// Final result:
// {
//   port: 9000,            // from env var (highest priority)
//   db: 'prod.example.com' // from production config
// }

// The merge happens in this order:
// defaults -> base files -> env-specific files -> env vars`}
          language="typescript"
          filename="resolution-order.ts"
        />
      </div>
    </div>
  );
}
