import { CodeBlockIDE } from '../components/code/CodeBlockIDE';

export function API() {
  return (
    <div className="py-12 max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">API Reference</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          Complete API documentation for @oxog/config. All methods, interfaces, and types explained in detail.
        </p>

        {/* loadConfig */}
        <h2 id="loadconfig">loadConfig(options)</h2>
        <p>
          The main entry point for loading configuration. Returns a Promise that resolves to a Config instance
          with all your configuration data loaded and merged.
        </p>

        <h3>Type Signature</h3>
        <CodeBlockIDE
          code={`function loadConfig<T extends Record<string, unknown> = Record<string, unknown>>(
  options: LoadOptions
): Promise<Config<T>>`}
          language="typescript"
          filename="signature.ts"
          showLineNumbers={false}
        />

        <h3>Options</h3>
        <CodeBlockIDE
          code={`interface LoadOptions {
  // Required: Unique name for this configuration
  name: string;

  // Paths to configuration files (supports glob patterns)
  paths?: string[];

  // Base directory for resolving paths (default: process.cwd())
  cwd?: string;

  // Current environment (e.g., 'development', 'production')
  env?: string;

  // List of valid environments for validation
  environments?: string[];

  // Prefix for environment variables (e.g., 'APP_')
  envPrefix?: string;

  // Default values applied before file loading
  defaults?: Record<string, unknown>;

  // Required keys that must exist (throws if missing)
  required?: string[];

  // How to merge configurations from multiple sources
  mergeStrategy?: MergeStrategyOptions;

  // Enable file watching for hot reload
  watch?: boolean;

  // File watching options
  watchOptions?: WatchOptions;

  // Plugins to extend functionality
  plugins?: ConfigPlugin[];
}`}
          language="typescript"
          filename="LoadOptions.ts"
        />

        <h3>Example Usage</h3>
        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';

// Basic usage
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
});

// With environment and defaults
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config/*.yaml'],
  env: process.env.NODE_ENV || 'development',
  environments: ['development', 'staging', 'production'],
  defaults: {
    port: 3000,
    debug: false,
  },
  required: ['database.host', 'database.port'],
});

// With type safety
interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
  };
}

const config = await loadConfig<AppConfig>({
  name: 'myapp',
  paths: ['./config.yaml'],
});`}
          language="typescript"
          filename="examples.ts"
        />

        {/* Config Instance */}
        <h2 id="config-instance">Config Instance</h2>
        <p>
          The Config instance returned by <code>loadConfig()</code> provides methods
          to access and manipulate configuration values.
        </p>

        {/* get */}
        <h3 id="get">get&lt;V&gt;(path, defaultValue?)</h3>
        <p>
          Retrieves a value at the specified path using dot notation. Returns the default value
          if the path doesn't exist.
        </p>

        <CodeBlockIDE
          code={`// Get a simple value
const port = config.get('port'); // 3000

// Get nested values using dot notation
const dbHost = config.get('database.host'); // 'localhost'
const dbPort = config.get('database.port'); // 5432

// Get with default value
const timeout = config.get('server.timeout', 5000); // returns 5000 if not set

// Get array values
const features = config.get('features'); // ['auth', 'logging']
const firstFeature = config.get('features.0'); // 'auth'

// Type-safe get (with generic config)
const port: number = config.get('port');`}
          language="typescript"
          filename="get-examples.ts"
        />

        {/* set */}
        <h3 id="set">set(path, value)</h3>
        <p>
          Sets a value at the specified path. Creates nested objects as needed.
          Emits a 'change' event when called.
        </p>

        <CodeBlockIDE
          code={`// Set a simple value
config.set('port', 8080);

// Set nested values (creates parent objects automatically)
config.set('database.credentials.password', 'secret');

// Set entire objects
config.set('server', {
  host: '0.0.0.0',
  port: 3000,
  timeout: 30000,
});

// Set array values
config.set('features', ['auth', 'logging', 'caching']);`}
          language="typescript"
          filename="set-examples.ts"
        />

        {/* has */}
        <h3 id="has">has(path)</h3>
        <p>
          Checks if a path exists in the configuration. Returns <code>true</code> even if the value
          is <code>null</code> or <code>undefined</code>.
        </p>

        <CodeBlockIDE
          code={`if (config.has('database')) {
  console.log('Database is configured');
}

if (config.has('features.auth')) {
  console.log('Auth feature enabled');
}

// Check before accessing
const timeout = config.has('server.timeout')
  ? config.get('server.timeout')
  : 5000;`}
          language="typescript"
          filename="has-examples.ts"
        />

        {/* delete */}
        <h3 id="delete">delete(path)</h3>
        <p>
          Removes a value at the specified path. Returns <code>true</code> if the path existed
          and was deleted, <code>false</code> otherwise.
        </p>

        <CodeBlockIDE
          code={`// Delete a value
config.delete('server.debug');

// Delete nested value
config.delete('database.credentials.password');

// Conditional delete
if (process.env.NODE_ENV === 'production') {
  config.delete('debug');
}`}
          language="typescript"
          filename="delete-examples.ts"
        />

        {/* toObject */}
        <h3 id="toobject">toObject()</h3>
        <p>
          Returns the entire configuration as a plain JavaScript object.
          Useful for serialization or passing to other libraries.
        </p>

        <CodeBlockIDE
          code={`// Get all config as object
const allConfig = config.toObject();
console.log(JSON.stringify(allConfig, null, 2));

// Pass to other libraries
const db = new Database(config.toObject().database);

// Type-safe with generics
interface AppConfig {
  port: number;
  database: { host: string };
}
const typedConfig: AppConfig = config.toObject();`}
          language="typescript"
          filename="toObject-examples.ts"
        />

        {/* reload */}
        <h3 id="reload">reload()</h3>
        <p>
          Reloads configuration from all sources. Returns a Promise that resolves
          when loading is complete. Emits 'reload' event.
        </p>

        <CodeBlockIDE
          code={`// Manual reload
await config.reload();
console.log('Configuration reloaded');

// Reload on signal
process.on('SIGHUP', async () => {
  await config.reload();
  console.log('Config reloaded via SIGHUP');
});`}
          language="typescript"
          filename="reload-examples.ts"
        />

        {/* watch/unwatch */}
        <h3 id="watch">watch() / unwatch()</h3>
        <p>
          Starts or stops watching configuration files for changes. When a change is detected,
          the configuration is automatically reloaded and events are emitted.
        </p>

        <CodeBlockIDE
          code={`// Start watching
config.watch();

// Listen for changes
config.on('change', (event) => {
  console.log(\`Config changed: \${event.path} = \${event.value}\`);
});

config.on('reload', () => {
  console.log('Configuration files reloaded');
});

// Stop watching
config.unwatch();`}
          language="typescript"
          filename="watch-examples.ts"
        />

        {/* Events */}
        <h3 id="events">on(event, callback) / off(event, callback)</h3>
        <p>
          Subscribe to configuration events. Available events: 'change', 'reload', 'error'.
        </p>

        <CodeBlockIDE
          code={`// Subscribe to changes
const handleChange = (event) => {
  console.log(\`\${event.path} changed from \${event.oldValue} to \${event.value}\`);
};
config.on('change', handleChange);

// Subscribe to reload
config.on('reload', () => {
  console.log('All configuration reloaded');
});

// Subscribe to errors
config.on('error', (error) => {
  console.error('Config error:', error);
});

// Unsubscribe
config.off('change', handleChange);`}
          language="typescript"
          filename="events-examples.ts"
        />

        {/* Merge Strategies */}
        <h2 id="merge-strategies">Merge Strategies</h2>
        <p>
          Configure how configurations from multiple sources are combined.
        </p>

        <CodeBlockIDE
          code={`interface MergeStrategyOptions {
  // Default strategy for all values
  default: 'replace' | 'merge';

  // Strategy for arrays
  arrays: 'replace' | 'append' | 'prepend' | 'unique';

  // Path-specific strategies
  paths?: Record<string, 'replace' | 'merge' | 'append' | 'prepend' | 'unique'>;
}`}
          language="typescript"
          filename="MergeStrategyOptions.ts"
        />

        <h3>Strategy Examples</h3>
        <CodeBlockIDE
          code={`// Replace strategy (default)
// Second value completely replaces first
{ features: ['a'] } + { features: ['b'] } = { features: ['b'] }

// Append strategy
// Arrays are concatenated
{ features: ['a'] } + { features: ['b'] } = { features: ['a', 'b'] }

// Unique strategy
// Arrays are merged with duplicates removed
{ features: ['a', 'b'] } + { features: ['b', 'c'] } = { features: ['a', 'b', 'c'] }

// Usage
const config = await loadConfig({
  name: 'myapp',
  mergeStrategy: {
    default: 'merge',
    arrays: 'unique',
    paths: {
      'server.plugins': 'append',
      'database.hosts': 'unique',
    },
  },
});`}
          language="typescript"
          filename="merge-examples.ts"
        />

        {/* Plugins */}
        <h2 id="plugins">Plugin System</h2>
        <p>
          Extend @oxog/config with plugins. The plugin architecture follows a micro-kernel design.
        </p>

        <h3>Plugin Interface</h3>
        <CodeBlockIDE
          code={`interface ConfigPlugin {
  // Unique plugin name
  name: string;

  // Plugin version
  version?: string;

  // Plugin priority (higher runs first)
  priority?: number;

  // Called when plugin is registered
  onRegister?: (config: Config) => void | Promise<void>;

  // Called after config is loaded
  onLoad?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;

  // Called before config is saved
  onSave?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;

  // Called when a value changes
  onChange?: (path: string, value: unknown, oldValue: unknown) => void;

  // Called when plugin is unregistered
  onUnregister?: () => void | Promise<void>;
}`}
          language="typescript"
          filename="ConfigPlugin.ts"
        />

        <h3>Using Plugins</h3>
        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { validationPlugin, encryptionPlugin } from '@oxog/config/plugins';

const config = await loadConfig({
  name: 'myapp',
  plugins: [
    validationPlugin({
      schema: {
        type: 'object',
        properties: {
          port: { type: 'number', minimum: 1, maximum: 65535 },
          database: {
            type: 'object',
            properties: {
              host: { type: 'string' },
              port: { type: 'number' },
            },
            required: ['host', 'port'],
          },
        },
        required: ['port'],
      },
    }),
    encryptionPlugin({
      secretKey: process.env.CONFIG_SECRET,
      paths: ['database.password', 'api.key'],
    }),
  ],
});

// Register plugin at runtime
config.use(myCustomPlugin);

// Unregister plugin
config.unregister('my-custom-plugin');

// List registered plugins
const plugins = config.plugins;`}
          language="typescript"
          filename="plugin-examples.ts"
        />

        {/* Available Plugins */}
        <h2 id="available-plugins">Available Plugins</h2>

        <h3>Core Plugins (Auto-loaded)</h3>
        <div className="not-prose">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Plugin</th>
                <th className="border border-border px-4 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2"><code>json-parser</code></td>
                <td className="border border-border px-4 py-2">JSON file format support</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>env-parser</code></td>
                <td className="border border-border px-4 py-2">ENV file and environment variable support</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>merge</code></td>
                <td className="border border-border px-4 py-2">Configuration merging with strategies</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>defaults</code></td>
                <td className="border border-border px-4 py-2">Default value application</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-8">Optional Plugins</h3>
        <div className="not-prose">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Plugin</th>
                <th className="border border-border px-4 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2"><code>yaml-parser</code></td>
                <td className="border border-border px-4 py-2">YAML file format support</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>toml-parser</code></td>
                <td className="border border-border px-4 py-2">TOML file format support</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>ini-parser</code></td>
                <td className="border border-border px-4 py-2">INI file format support</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>validation</code></td>
                <td className="border border-border px-4 py-2">JSON Schema validation</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>encryption</code></td>
                <td className="border border-border px-4 py-2">AES-256-GCM encrypted secrets</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>watch</code></td>
                <td className="border border-border px-4 py-2">File watching with debouncing</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>cache</code></td>
                <td className="border border-border px-4 py-2">In-memory configuration caching</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>interpolation</code></td>
                <td className="border border-border px-4 py-2">Variable interpolation ($&#123;var&#125; syntax)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Error Handling */}
        <h2 id="error-handling" className="mt-12">Error Handling</h2>
        <p>
          @oxog/config throws typed errors for different failure scenarios.
        </p>

        <CodeBlockIDE
          code={`import { loadConfig, ConfigError, ValidationError, ParseError } from '@oxog/config';

try {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
    required: ['database.host'],
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.errors);
  } else if (error instanceof ParseError) {
    console.error('Parse error in', error.file, ':', error.message);
  } else if (error instanceof ConfigError) {
    console.error('Config error:', error.message);
  } else {
    throw error;
  }
}`}
          language="typescript"
          filename="error-handling.ts"
        />

        {/* TypeScript */}
        <h2 id="typescript">TypeScript Support</h2>
        <p>
          Full TypeScript support with generic types for type-safe configuration access.
        </p>

        <CodeBlockIDE
          code={`// Define your config interface
interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  credentials?: {
    username: string;
    password: string;
  };
}

interface ServerConfig {
  port: number;
  timeout: number;
  plugins: string[];
}

interface AppConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  features: string[];
  debug: boolean;
}

// Load with type parameter
const config = await loadConfig<AppConfig>({
  name: 'myapp',
  paths: ['./config.yaml'],
});

// Type-safe access
const port: number = config.get('server.port');
const dbHost: string = config.get('database.host');
const features: string[] = config.get('features');

// TypeScript will catch errors
// config.get('nonexistent'); // Error: Property doesn't exist
// config.get('server.port') + 'string'; // Works but type is number`}
          language="typescript"
          filename="typescript-support.ts"
        />
      </div>
    </div>
  );
}
