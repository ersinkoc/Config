import { CodeBlockIDE } from '../../components/code/CodeBlockIDE';

export function Plugins() {
  return (
    <div className="py-12 max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Plugins</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          @oxog/config uses a plugin architecture that allows you to extend functionality,
          add custom parsers, or modify configuration data during the loading process.
        </p>

        {/* Plugin System Overview */}
        <h2>Plugin System Overview</h2>
        <p>
          The plugin system follows a micro-kernel design where the core provides minimal functionality
          and plugins add features. This keeps the bundle small while allowing extensive customization.
        </p>

        <div className="not-prose my-8 p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Plugin Lifecycle Hooks</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 font-mono">onRegister</span>
              <span className="text-muted-foreground">Called when plugin is first registered</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 font-mono">onLoad</span>
              <span className="text-muted-foreground">Called after config is loaded, can transform data</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 font-mono">onChange</span>
              <span className="text-muted-foreground">Called when a configuration value changes</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-500 font-mono">onSave</span>
              <span className="text-muted-foreground">Called before config is saved, can transform data</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-mono">onUnregister</span>
              <span className="text-muted-foreground">Called when plugin is removed</span>
            </div>
          </div>
        </div>

        {/* Plugin Interface */}
        <h2>Plugin Interface</h2>
        <p>Every plugin must implement the <code>ConfigPlugin</code> interface:</p>

        <CodeBlockIDE
          code={`interface ConfigPlugin {
  // Required: Unique identifier for the plugin
  name: string;

  // Optional: Semantic version (e.g., '1.0.0')
  version?: string;

  // Optional: Execution priority (higher = runs first)
  // Default: 0, Range: -1000 to 1000
  priority?: number;

  // Optional: Plugin dependencies (other plugin names)
  dependencies?: string[];

  // Lifecycle hooks (all optional)
  onRegister?: (config: Config) => void | Promise<void>;
  onLoad?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  onSave?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  onChange?: (path: string, value: unknown, oldValue: unknown) => void;
  onUnregister?: () => void | Promise<void>;
}`}
          language="typescript"
          filename="ConfigPlugin.ts"
        />

        {/* Built-in Plugins */}
        <h2>Built-in Plugins</h2>

        <h3>Validation Plugin</h3>
        <p>Validate configuration against a JSON Schema:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { validationPlugin } from '@oxog/config/plugins';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [
    validationPlugin({
      // JSON Schema draft-07
      schema: {
        type: 'object',
        properties: {
          port: {
            type: 'number',
            minimum: 1,
            maximum: 65535,
          },
          database: {
            type: 'object',
            properties: {
              host: { type: 'string', minLength: 1 },
              port: { type: 'number' },
              ssl: { type: 'boolean' },
            },
            required: ['host', 'port'],
          },
        },
        required: ['port', 'database'],
      },
      // Optional: throw on validation error (default: true)
      strict: true,
    }),
  ],
});`}
          language="typescript"
          filename="validation-plugin.ts"
        />

        <h3>Encryption Plugin</h3>
        <p>Encrypt and decrypt sensitive configuration values using AES-256-GCM:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { encryptionPlugin, encrypt } from '@oxog/config/plugins';

// Step 1: Encrypt your secrets (one-time setup)
const secretKey = 'your-32-byte-secret-key-here!!!'; // 32 bytes
const encryptedPassword = encrypt('my-db-password', secretKey);
// Store encryptedPassword in your config file

// Step 2: Load config with automatic decryption
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [
    encryptionPlugin({
      // Your encryption key (keep this secret!)
      secretKey: process.env.CONFIG_SECRET_KEY!,

      // Paths to encrypted values
      paths: [
        'database.password',
        'api.secret',
        'oauth.clientSecret',
      ],

      // Optional: prefix for encrypted values (default: 'enc:v1:')
      prefix: 'enc:v1:',
    }),
  ],
});

// Access decrypted values normally
const dbPassword = config.get('database.password'); // Decrypted!`}
          language="typescript"
          filename="encryption-plugin.ts"
        />

        <h3>Interpolation Plugin</h3>
        <p>Reference other configuration values and environment variables:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { interpolationPlugin } from '@oxog/config/plugins';

// config.yaml:
// app:
//   name: myapp
//   version: 1.0.0
// paths:
//   base: /var/data
//   logs: \${paths.base}/logs
//   cache: \${paths.base}/cache/\${app.name}
// database:
//   host: \${DATABASE_HOST:-localhost}
//   port: \${DATABASE_PORT:-5432}

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [
    interpolationPlugin({
      // Enable environment variable substitution
      env: true,

      // Enable config value substitution
      config: true,

      // Default value syntax: \${VAR:-default}
      defaultSyntax: true,

      // Maximum interpolation depth (prevent infinite loops)
      maxDepth: 10,
    }),
  ],
});

// Variables are resolved
console.log(config.get('paths.logs'));  // /var/data/logs
console.log(config.get('paths.cache')); // /var/data/cache/myapp
console.log(config.get('database.host')); // localhost (or DATABASE_HOST)`}
          language="typescript"
          filename="interpolation-plugin.ts"
        />

        <h3>Watch Plugin</h3>
        <p>Watch configuration files for changes with automatic reloading:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { watchPlugin } from '@oxog/config/plugins';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [
    watchPlugin({
      // Debounce delay in ms (default: 100)
      debounce: 100,

      // Watch for file creation (default: true)
      watchCreation: true,

      // Paths to ignore
      ignore: ['**/*.bak', '**/.git/**'],
    }),
  ],
});

// Subscribe to reload events
config.on('reload', () => {
  console.log('Config reloaded!');
  // Restart services, update caches, etc.
});

// Subscribe to individual changes
config.on('change', (event) => {
  console.log(\`Changed: \${event.path}\`);
});

// Cleanup when done
process.on('SIGTERM', () => {
  config.unwatch();
});`}
          language="typescript"
          filename="watch-plugin.ts"
        />

        <h3>Cache Plugin</h3>
        <p>Cache configuration in memory for faster access:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { cachePlugin } from '@oxog/config/plugins';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [
    cachePlugin({
      // Cache TTL in ms (default: Infinity)
      ttl: 60000, // 1 minute

      // Maximum cache entries (default: 1000)
      maxSize: 1000,

      // Auto-invalidate on changes (default: true)
      invalidateOnChange: true,
    }),
  ],
});

// First access reads from config
config.get('database.host'); // Reads from config

// Subsequent access reads from cache (faster)
config.get('database.host'); // Reads from cache`}
          language="typescript"
          filename="cache-plugin.ts"
        />

        {/* Creating Custom Plugins */}
        <h2>Creating Custom Plugins</h2>
        <p>Create your own plugins to extend functionality:</p>

        <h3>Simple Logging Plugin</h3>
        <CodeBlockIDE
          code={`import { ConfigPlugin } from '@oxog/config';

const loggingPlugin: ConfigPlugin = {
  name: 'logging',
  version: '1.0.0',
  priority: 100, // Run early

  onRegister(config) {
    console.log('[Config] Logging plugin registered');
  },

  onLoad(data) {
    console.log('[Config] Loaded:', Object.keys(data).length, 'keys');
    return data; // Must return data!
  },

  onChange(path, value, oldValue) {
    console.log(\`[Config] Changed: \${path}\`);
    console.log(\`  From: \${JSON.stringify(oldValue)}\`);
    console.log(\`  To: \${JSON.stringify(value)}\`);
  },

  onUnregister() {
    console.log('[Config] Logging plugin unregistered');
  },
};

// Use the plugin
const config = await loadConfig({
  name: 'myapp',
  plugins: [loggingPlugin],
});`}
          language="typescript"
          filename="logging-plugin.ts"
        />

        <h3>Environment-Specific Defaults Plugin</h3>
        <CodeBlockIDE
          code={`import { ConfigPlugin } from '@oxog/config';

interface EnvDefaultsOptions {
  development?: Record<string, unknown>;
  staging?: Record<string, unknown>;
  production?: Record<string, unknown>;
}

function envDefaultsPlugin(options: EnvDefaultsOptions): ConfigPlugin {
  return {
    name: 'env-defaults',
    version: '1.0.0',

    onLoad(data) {
      const env = process.env.NODE_ENV || 'development';
      const defaults = options[env as keyof EnvDefaultsOptions] || {};

      // Deep merge defaults with loaded data
      return deepMerge(defaults, data);
    },
  };
}

// Usage
const config = await loadConfig({
  name: 'myapp',
  plugins: [
    envDefaultsPlugin({
      development: {
        debug: true,
        database: { host: 'localhost' },
      },
      production: {
        debug: false,
        database: { host: 'db.prod.example.com' },
      },
    }),
  ],
});`}
          language="typescript"
          filename="env-defaults-plugin.ts"
        />

        <h3>Computed Values Plugin</h3>
        <CodeBlockIDE
          code={`import { ConfigPlugin } from '@oxog/config';

function computedPlugin(): ConfigPlugin {
  return {
    name: 'computed',
    version: '1.0.0',
    priority: -100, // Run last (after other transformations)

    onLoad(data: Record<string, any>) {
      const db = data.database || {};

      return {
        ...data,
        computed: {
          // Build connection URL
          databaseUrl: \`postgresql://\${db.host}:\${db.port}/\${db.name}\`,

          // Environment flags
          isDevelopment: process.env.NODE_ENV === 'development',
          isProduction: process.env.NODE_ENV === 'production',

          // Timestamps
          loadedAt: new Date().toISOString(),
          version: process.env.npm_package_version || '0.0.0',
        },
      };
    },
  };
}

// Usage
const config = await loadConfig({
  name: 'myapp',
  plugins: [computedPlugin()],
});

console.log(config.get('computed.databaseUrl'));
console.log(config.get('computed.isDevelopment'));`}
          language="typescript"
          filename="computed-plugin.ts"
        />

        <h3>Secrets Manager Plugin</h3>
        <CodeBlockIDE
          code={`import { ConfigPlugin } from '@oxog/config';

interface SecretsOptions {
  provider: 'aws' | 'azure' | 'gcp';
  paths: string[];
}

function secretsManagerPlugin(options: SecretsOptions): ConfigPlugin {
  return {
    name: 'secrets-manager',
    version: '1.0.0',
    priority: 50,

    async onLoad(data) {
      const result = { ...data };

      for (const path of options.paths) {
        const value = getNestedValue(result, path);

        if (typeof value === 'string' && value.startsWith('secret:')) {
          const secretId = value.slice(7);
          const secret = await fetchSecret(options.provider, secretId);
          setNestedValue(result, path, secret);
        }
      }

      return result;
    },
  };
}

async function fetchSecret(provider: string, secretId: string): Promise<string> {
  // Implement based on provider
  // AWS: SecretsManager.getSecretValue()
  // Azure: KeyVault.getSecret()
  // GCP: SecretManager.accessSecretVersion()
  return 'fetched-secret-value';
}

// Usage
const config = await loadConfig({
  name: 'myapp',
  plugins: [
    secretsManagerPlugin({
      provider: 'aws',
      paths: ['database.password', 'api.key'],
    }),
  ],
});`}
          language="typescript"
          filename="secrets-manager-plugin.ts"
        />

        {/* Plugin Best Practices */}
        <h2>Plugin Best Practices</h2>

        <ul>
          <li>
            <strong>Always return data from <code>onLoad</code>:</strong> The data passed to <code>onLoad</code>
            must be returned (transformed or not). Forgetting to return will result in empty configuration.
          </li>
          <li>
            <strong>Use priority wisely:</strong> Higher priority plugins run first during <code>onLoad</code>.
            Use high priority (100+) for logging/debugging, normal (0) for transformations,
            and low priority (-100) for final computations.
          </li>
          <li>
            <strong>Handle async operations:</strong> All hooks can be async. Return Promises when doing I/O.
          </li>
          <li>
            <strong>Provide meaningful names:</strong> Plugin names should be unique and descriptive.
            They're used for debugging and dependency resolution.
          </li>
          <li>
            <strong>Document dependencies:</strong> If your plugin depends on another, declare it in the
            <code>dependencies</code> array.
          </li>
          <li>
            <strong>Clean up in <code>onUnregister</code>:</strong> Close connections, clear intervals,
            and release resources when the plugin is removed.
          </li>
        </ul>

        {/* Plugin Priority */}
        <h2>Plugin Priority</h2>
        <p>
          Plugins are executed in priority order. Higher priority runs first for <code>onLoad</code>,
          and last for <code>onSave</code> (reverse order).
        </p>

        <div className="not-prose my-8">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Priority Range</th>
                <th className="border border-border px-4 py-2 text-left">Recommended Use</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2"><code>100+</code></td>
                <td className="border border-border px-4 py-2">Logging, debugging, metrics</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>50</code></td>
                <td className="border border-border px-4 py-2">Secret fetching, external data</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>0</code> (default)</td>
                <td className="border border-border px-4 py-2">Standard transformations</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>-50</code></td>
                <td className="border border-border px-4 py-2">Interpolation, variable resolution</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2"><code>-100</code></td>
                <td className="border border-border px-4 py-2">Computed values, validation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
