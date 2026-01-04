# @oxog/config

Zero-dependency configuration loader with multi-format support and plugin extensibility.

[![npm version](https://img.shields.io/npm/v/@oxog/config.svg)](https://www.npmjs.com/package/@oxog/config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

## Features

- **Multi-format support** - JSON, YAML, TOML, INI, ENV out of the box
- **Zero dependencies** - Pure TypeScript implementation
- **Type-safe** - Full TypeScript support with generics
- **Plugin system** - Micro-kernel architecture for extensibility
- **Environment overrides** - Automatic environment-based configuration
- **Deep merging** - Multiple merge strategies (replace, merge, append, prepend, unique)
- **Hot reload** - File watching with debouncing
- **Encryption** - AES-256-GCM for sensitive values
- **Validation** - JSON Schema support

## Installation

```bash
npm install @oxog/config
```

## Quick Start

```typescript
import { loadConfig } from '@oxog/config';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
  env: process.env.NODE_ENV || 'development',
});

// Access values
const port = config.get('port');
const dbHost = config.get('database.host');
```

### Type-Safe Configuration

```typescript
interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
  };
}

const config = await loadConfig<AppConfig>({ name: 'myapp' });
const port: number = config.get('port'); // Type-safe!
```

## Supported Formats

### JSON
```json
{
  "port": 3000,
  "database": { "host": "localhost", "port": 5432 }
}
```

### YAML
```yaml
port: 3000
database:
  host: localhost
  port: 5432
```

### TOML
```toml
port = 3000

[database]
host = "localhost"
port = 5432
```

### INI
```ini
port = 3000

[database]
host = localhost
port = 5432
```

### ENV
```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

## Environment Overrides

Automatically loads environment-specific configurations:

```
config.yaml              # Base config
config.development.yaml  # Development overrides
config.production.yaml   # Production overrides
config.local.yaml        # Local overrides (gitignored)
.env                     # Environment variables
```

## Merge Strategies

```typescript
const config = await loadConfig({
  name: 'myapp',
  mergeStrategy: {
    default: 'merge',
    arrays: 'unique',
    paths: {
      'server.plugins': 'append',
    },
  },
});
```

## Plugins

### Core Plugins (Always Loaded)
- `json-parser` - JSON format support
- `env-parser` - ENV format and environment variables
- `merge` - Configuration merging
- `defaults` - Default values and validation

### Optional Plugins

```typescript
import { validationPlugin, yamlParserPlugin } from '@oxog/config/plugins';

const config = await loadConfig({ name: 'myapp' });

// Add YAML support
config.use(yamlParserPlugin());

// Add schema validation
config.use(validationPlugin({
  schema: {
    type: 'object',
    properties: {
      port: { type: 'number', minimum: 1, maximum: 65535 },
    },
    required: ['port'],
  },
}));
```

## API Reference

### loadConfig(options)

```typescript
interface LoadOptions {
  name: string;              // Application name
  paths?: string[];          // Config file paths
  cwd?: string;              // Base directory
  env?: string;              // Current environment
  environments?: string[];   // Supported environments
  envPrefix?: string;        // Env var prefix
  defaults?: object;         // Default values
  required?: string[];       // Required field paths
  mergeStrategy?: object;    // Merge strategies
  watch?: boolean;           // Enable file watching
  plugins?: ConfigPlugin[];  // Plugins to use
}
```

### Config Instance

| Method | Description |
|--------|-------------|
| `get(path, default?)` | Get value at path |
| `set(path, value)` | Set value at path |
| `has(path)` | Check if path exists |
| `delete(path)` | Delete value at path |
| `toObject()` | Get all config as object |
| `reload()` | Reload from files |
| `watch()` | Start file watching |
| `unwatch()` | Stop file watching |
| `use(plugin)` | Register plugin |
| `on(event, handler)` | Register event listener |
| `off(event, handler)` | Remove event listener |

## Bundle Size

| Package | Size |
|---------|------|
| Core | ~5KB gzipped |
| With all plugins | ~15KB gzipped |

**Zero runtime dependencies**

## Documentation

Visit [config.oxog.dev](https://config.oxog.dev) for full documentation.

## License

MIT

## Author

Ersin Koc ([@ersinkoc](https://github.com/ersinkoc))
