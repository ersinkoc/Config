import { CodeBlockIDE } from '../components/code/CodeBlockIDE';

export function Examples() {
  return (
    <div className="py-12 max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Examples</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          Real-world examples showing how to use @oxog/config in your applications.
          From basic usage to advanced patterns.
        </p>

        {/* Express.js Server */}
        <h2>Express.js Server</h2>
        <p>Complete example of configuring an Express.js server with database and middleware settings:</p>

        <CodeBlockIDE
          code={`# config.yaml
server:
  port: 3000
  host: localhost
  cors:
    origin: "*"
    credentials: true

database:
  host: localhost
  port: 5432
  name: myapp_db
  pool:
    min: 2
    max: 10

logging:
  level: info
  format: json`}
          language="yaml"
          filename="config.yaml"
        />

        <CodeBlockIDE
          code={`import express from 'express';
import cors from 'cors';
import { loadConfig } from '@oxog/config';

interface ServerConfig {
  server: {
    port: number;
    host: string;
    cors: { origin: string; credentials: boolean };
  };
  database: {
    host: string;
    port: number;
    name: string;
    pool: { min: number; max: number };
  };
  logging: {
    level: string;
    format: string;
  };
}

async function bootstrap() {
  const config = await loadConfig<ServerConfig>({
    name: 'myapp',
    paths: ['./config.yaml'],
    env: process.env.NODE_ENV || 'development',
  });

  const app = express();

  // Configure CORS from config
  app.use(cors({
    origin: config.get('server.cors.origin'),
    credentials: config.get('server.cors.credentials'),
  }));

  // Use config values
  const port = config.get('server.port');
  const host = config.get('server.host');

  app.listen(port, host, () => {
    console.log(\`Server running at http://\${host}:\${port}\`);
  });
}

bootstrap();`}
          language="typescript"
          filename="server.ts"
        />

        {/* Environment-Based Configuration */}
        <h2>Environment-Based Configuration</h2>
        <p>
          Automatically merge environment-specific settings. The loader will merge
          <code>config.yaml</code> with <code>config.production.yaml</code> when
          <code>NODE_ENV=production</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <CodeBlockIDE
              code={`# config.yaml (base)
port: 3000
debug: true

database:
  host: localhost
  port: 5432

logging:
  level: debug`}
              language="yaml"
              filename="config.yaml"
            />
          </div>
          <div>
            <CodeBlockIDE
              code={`# config.production.yaml
port: 8080
debug: false

database:
  host: db.example.com
  ssl: true

logging:
  level: error`}
              language="yaml"
              filename="config.production.yaml"
            />
          </div>
        </div>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  env: process.env.NODE_ENV || 'development',
  environments: ['development', 'staging', 'production'],
});

// In development: port = 3000, debug = true
// In production:  port = 8080, debug = false, database.ssl = true
console.log(config.get('port'));
console.log(config.get('database.host'));`}
          language="typescript"
          filename="env-config.ts"
        />

        {/* Hot Reload */}
        <h2>Hot Reload with File Watching</h2>
        <p>Automatically reload configuration when files change:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  watch: true,
  watchOptions: {
    debounce: 100, // Wait 100ms before reloading
  },
});

// Listen for configuration changes
config.on('change', (event) => {
  console.log(\`Config changed: \${event.path}\`);
  console.log(\`  Old value: \${JSON.stringify(event.oldValue)}\`);
  console.log(\`  New value: \${JSON.stringify(event.value)}\`);
});

config.on('reload', () => {
  console.log('Configuration reloaded from files');
  // Restart services, update caches, etc.
  restartDatabaseConnection(config.get('database'));
});

config.on('error', (error) => {
  console.error('Config error:', error);
});

// Stop watching when done
process.on('SIGTERM', () => {
  config.unwatch();
  process.exit(0);
});`}
          language="typescript"
          filename="hot-reload.ts"
        />

        {/* Encrypted Secrets */}
        <h2>Encrypted Secrets</h2>
        <p>Store sensitive values securely with AES-256-GCM encryption:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { encryptionPlugin, encrypt } from '@oxog/config/plugins';

// First, encrypt your secrets (run once)
const secretKey = process.env.CONFIG_SECRET_KEY;
const encrypted = encrypt('my-api-secret-key', secretKey);
console.log(encrypted); // Save this to your config file

// config.yaml with encrypted values
// database:
//   password: "enc:v1:abc123..."  # encrypted value
// api:
//   key: "enc:v1:xyz789..."       # encrypted value`}
          language="typescript"
          filename="encrypt-secrets.ts"
        />

        <CodeBlockIDE
          code={`// Load config with automatic decryption
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [
    encryptionPlugin({
      secretKey: process.env.CONFIG_SECRET_KEY,
      // Specify which paths contain encrypted values
      paths: ['database.password', 'api.key'],
    }),
  ],
});

// Values are automatically decrypted
const dbPassword = config.get('database.password'); // Decrypted!
const apiKey = config.get('api.key'); // Decrypted!`}
          language="typescript"
          filename="decrypt-config.ts"
        />

        {/* Variable Interpolation */}
        <h2>Variable Interpolation</h2>
        <p>Reference other config values and environment variables:</p>

        <CodeBlockIDE
          code={`# config.yaml
app:
  name: myapp
  version: 1.0.0

paths:
  data: /var/data/\${app.name}
  logs: /var/log/\${app.name}
  cache: \${paths.data}/cache

database:
  host: \${DATABASE_HOST:-localhost}
  port: \${DATABASE_PORT:-5432}
  url: postgresql://\${database.host}:\${database.port}/\${app.name}`}
          language="yaml"
          filename="config.yaml"
        />

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { interpolationPlugin } from '@oxog/config/plugins';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [interpolationPlugin()],
});

// Variables are resolved
console.log(config.get('paths.data'));  // /var/data/myapp
console.log(config.get('paths.cache')); // /var/data/myapp/cache
console.log(config.get('database.url')); // postgresql://localhost:5432/myapp`}
          language="typescript"
          filename="interpolation.ts"
        />

        {/* Schema Validation */}
        <h2>Schema Validation</h2>
        <p>Validate configuration with JSON Schema and get detailed error messages:</p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';
import { validationPlugin, ValidationError } from '@oxog/config/plugins';

const schema = {
  type: 'object',
  properties: {
    port: {
      type: 'number',
      minimum: 1,
      maximum: 65535,
      description: 'Server port number',
    },
    database: {
      type: 'object',
      properties: {
        host: { type: 'string', minLength: 1 },
        port: { type: 'number' },
        name: { type: 'string', pattern: '^[a-z_]+$' },
      },
      required: ['host', 'port', 'name'],
    },
    features: {
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true,
    },
  },
  required: ['port', 'database'],
};

try {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
    plugins: [validationPlugin({ schema })],
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Config validation failed:');
    error.errors.forEach(err => {
      console.error(\`  - \${err.path}: \${err.message}\`);
    });
    process.exit(1);
  }
  throw error;
}`}
          language="typescript"
          filename="validation.ts"
        />

        {/* Multiple Config Sources */}
        <h2>Multiple Configuration Sources</h2>
        <p>Merge configuration from multiple files with different priorities:</p>

        <CodeBlockIDE
          code={`const config = await loadConfig({
  name: 'myapp',
  paths: [
    './config/default.yaml',     // Base configuration
    './config/local.yaml',       // Local overrides (gitignored)
    './config/secrets.yaml',     // Secrets file
  ],
  // Environment variables take highest priority
  envPrefix: 'MYAPP_',
  // Merge strategies
  mergeStrategy: {
    default: 'merge',           // Deep merge objects
    arrays: 'unique',           // Merge arrays, remove duplicates
    paths: {
      'server.plugins': 'append', // Always append plugins
      'database.hosts': 'replace', // Replace hosts array entirely
    },
  },
});

// Resolution order (highest to lowest):
// 1. Environment variables (MYAPP_PORT, MYAPP_DATABASE_HOST, etc.)
// 2. secrets.yaml
// 3. local.yaml
// 4. default.yaml`}
          language="typescript"
          filename="multi-source.ts"
        />

        {/* Custom Plugin */}
        <h2>Creating a Custom Plugin</h2>
        <p>Extend functionality with your own plugins:</p>

        <CodeBlockIDE
          code={`import { ConfigPlugin, Config } from '@oxog/config';

// Plugin that logs all config access
const loggingPlugin: ConfigPlugin = {
  name: 'logging-plugin',
  version: '1.0.0',
  priority: 100, // Higher priority runs first

  onRegister(config: Config) {
    console.log('Logging plugin registered');
  },

  onLoad(data) {
    console.log('Config loaded:', Object.keys(data));
    return data; // Must return the data
  },

  onChange(path, value, oldValue) {
    console.log(\`Config changed: \${path}\`);
    console.log(\`  From: \${JSON.stringify(oldValue)}\`);
    console.log(\`  To: \${JSON.stringify(value)}\`);
  },

  onUnregister() {
    console.log('Logging plugin unregistered');
  },
};

// Plugin that adds computed values
const computedPlugin: ConfigPlugin = {
  name: 'computed-plugin',

  onLoad(data) {
    return {
      ...data,
      computed: {
        dbUrl: \`postgresql://\${data.database?.host}:\${data.database?.port}/\${data.database?.name}\`,
        isProduction: data.env === 'production',
        startedAt: new Date().toISOString(),
      },
    };
  },
};

// Use the plugins
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  plugins: [loggingPlugin, computedPlugin],
});

console.log(config.get('computed.dbUrl'));
console.log(config.get('computed.isProduction'));`}
          language="typescript"
          filename="custom-plugin.ts"
        />

        {/* Configuration Formats */}
        <h2>Configuration Formats</h2>
        <p>All supported configuration formats:</p>

        <h3>JSON</h3>
        <CodeBlockIDE
          code={`{
  "port": 3000,
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db"
  },
  "features": ["auth", "logging", "caching"]
}`}
          language="json"
          filename="config.json"
        />

        <h3>YAML</h3>
        <CodeBlockIDE
          code={`# Application configuration
port: 3000

database:
  host: localhost
  port: 5432
  name: myapp_db

features:
  - auth
  - logging
  - caching`}
          language="yaml"
          filename="config.yaml"
        />

        <h3>TOML</h3>
        <CodeBlockIDE
          code={`# Application configuration
port = 3000

[database]
host = "localhost"
port = 5432
name = "myapp_db"

features = ["auth", "logging", "caching"]`}
          language="toml"
          filename="config.toml"
        />

        <h3>INI</h3>
        <CodeBlockIDE
          code={`port = 3000

[database]
host = localhost
port = 5432
name = myapp_db`}
          language="ini"
          filename="config.ini"
        />

        <h3>ENV</h3>
        <CodeBlockIDE
          code={`PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp_db
FEATURES=auth,logging,caching`}
          language="bash"
          filename=".env"
        />

        {/* More Examples */}
        <h2>More Examples</h2>
        <p>Check out the examples directory in the repository for more detailed examples:</p>
        <ul>
          <li><a href="https://github.com/ersinkoc/config/tree/main/examples" className="text-primary hover:underline">GitHub Examples Repository</a></li>
        </ul>
      </div>
    </div>
  );
}
