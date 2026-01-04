# @oxog/config Specification

## Package Identity

**Package Name:** `@oxog/config`
**Version:** 1.0.0
**Description:** Zero-dependency configuration loader with multi-format support, environment merging, and plugin-based extensibility
**License:** MIT
**Author:** Ersin Koç (ersinkoc)
**Node.js Version:** >= 18
**TypeScript Version:** >= 5.0

---

## Architecture Overview

### Micro-Kernel Plugin Architecture

The package follows a micro-kernel architecture where a minimal core (kernel) manages plugins that provide functionality. This design enables:

- **Extensibility:** Add new features via plugins
- **Modularity:** Load only required functionality
- **Testability:** Test components in isolation
- **Maintainability:** Clear separation of concerns

#### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                     User Code                            │
├─────────────────────────────────────────────────────────┤
│               Plugin Registry API                        │
│    use() · register() · unregister() · list()           │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│  JSON    │  YAML    │  TOML    │  ENV     │  Community  │
│  Parser  │  Parser  │  Parser  │  Parser  │  Plugins    │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│                    Micro Kernel                          │
│     Event Bus · Lifecycle · Error Boundary · Cache       │
└─────────────────────────────────────────────────────────┘
```

#### Kernel Responsibilities

The kernel is minimal and focused on:
- Plugin registration and lifecycle management
- Event bus for inter-plugin communication
- Error boundary and recovery mechanisms
- Configuration cache management
- File system abstraction

---

## Core Features

### 1. Multi-Format Configuration Loading

Support for loading configuration files in multiple formats with automatic detection.

#### Supported Formats

| Format | Extensions | Parser | Status |
|--------|-----------|--------|--------|
| JSON | `.json` | Native JSON.parse | Core |
| YAML | `.yaml`, `.yml` | Custom parser | Optional |
| TOML | `.toml` | Custom parser | Optional |
| INI | `.ini` | Custom parser | Optional |
| ENV | `.env` | Custom parser | Core |
| JavaScript | `.js`, `.mjs` | ESM import | Optional |
| TypeScript | `.ts`, `.mts` | Custom evaluation | Optional |

#### Format Detection

- Automatic detection based on file extension
- Manual override via `format` option
- Support for explicit format specification

#### API Example

```typescript
import { loadConfig } from '@oxog/config';

// Auto-detect format from extension
const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml', './config.json'],
});

// Explicit format
const yamlConfig = await loadConfig({
  name: 'myapp',
  format: 'yaml',
  content: 'database:\n  host: localhost',
});
```

### 2. Environment-Based Overrides

Intelligent merging of environment-specific configurations with a well-defined resolution order.

#### Resolution Order

1. **Default config** - `config.yaml`
2. **Environment config** - `config.{env}.yaml` (e.g., `config.development.yaml`)
3. **Local config** - `config.local.yaml`
4. **Environment variables** - `MYAPP_*` (with configured prefix)

#### Environment Support

- Automatic environment detection via `NODE_ENV`
- Configurable environment list
- Custom environment variable prefix
- Local overrides for development

#### API Example

```typescript
const config = await loadConfig({
  name: 'myapp',
  environments: ['development', 'staging', 'production'],
  env: process.env.NODE_ENV || 'development',
  envPrefix: 'MYAPP_', // Override via MYAPP_DATABASE_HOST
});

// config.development.yaml overrides config.yaml
// MYAPP_DATABASE_HOST overrides config.development.yaml
```

### 3. Deep Merging with Customizable Strategy

Intelligent deep merge with configurable strategies for different data types and paths.

#### Merge Strategies

- **`replace`** - Replace entire value (default for primitives)
- **`merge`** - Deep merge objects (default for objects)
- **`append`** - Append to arrays
- **`prepend`** - Prepend to arrays
- **`unique`** - Merge arrays with unique values only

#### Strategy Configuration

- **Global default** - Apply to all values
- **Type-specific** - Different strategies for arrays vs objects
- **Path-specific** - Custom strategy per configuration path

#### API Example

```typescript
const config = await loadConfig({
  name: 'myapp',
  mergeStrategy: {
    default: 'merge',
    arrays: 'unique',
    paths: {
      'server.plugins': 'append',
      'database.hosts': 'replace',
    },
  },
});
```

### 4. Schema Validation (Optional Plugin)

Validate configuration against a schema with detailed, actionable error messages.

#### Validation Features

- JSON Schema support
- Type checking
- Required field validation
- Custom validators
- Detailed error reporting with paths

#### API Example

```typescript
import { validationPlugin } from '@oxog/config/plugins';

const schema = {
  type: 'object',
  properties: {
    port: { type: 'number', minimum: 1, maximum: 65535 },
    host: { type: 'string', pattern: '^[a-zA-Z0-9.-]+$' },
    database: {
      type: 'object',
      required: ['host', 'port'],
      properties: {
        host: { type: 'string' },
        port: { type: 'number' },
      },
    },
  },
  required: ['port', 'host'],
};

const config = await loadConfig({
  name: 'myapp',
  plugins: [validationPlugin({ schema })],
});
```

### 5. Watch Mode for Hot Reload

Watch configuration files for changes and automatically reload with event notifications.

#### Watch Features

- File system monitoring via native `fs.watch`
- Debounced updates to prevent rapid reload
- Persistent watching across restarts
- Change event emission with old/new values
- Error handling for deleted files

#### API Example

```typescript
const config = await loadConfig({
  name: 'myapp',
  watch: true,
  watchOptions: {
    debounce: 300, // ms
    persistent: true,
  },
});

config.on('change', (event) => {
  console.log('Config changed:', event.path);
  console.log('Old value:', event.oldValue);
  console.log('New value:', event.newValue);
});

config.on('error', (error) => {
  console.error('Config watch error:', error);
});

// Stop watching
config.unwatch();
```

### 6. Encrypted Secrets Support

Store and retrieve encrypted values in configuration files securely.

#### Encryption Features

- AES-256-GCM encryption
- Key derivation with PBKDF2
- Secure random IV generation
- Authentication tag verification
- Base64 encoding for storage
- Marker-based detection (e.g., `ENC:`)

#### API Example

```typescript
import { encryptionPlugin } from '@oxog/config/plugins';

const config = await loadConfig({
  name: 'myapp',
  plugins: [
    encryptionPlugin({
      key: process.env.CONFIG_ENCRYPTION_KEY,
      algorithm: 'aes-256-gcm',
      marker: 'ENC:', // Encrypted values start with ENC:
    }),
  ],
});

// In config.yaml:
// database:
//   password: ENC:aGVsbG8gd29ybGQ=

// Decrypted automatically when accessed
console.log(config.get('database.password')); // Original value
```

### 7. Default Values and Required Fields

Define default values and mark fields as required with meaningful error messages.

#### Features

- Fallback to defaults when value not provided
- Required field validation
- Nested path support (e.g., `database.host`)
- Configurable defaults per load

#### API Example

```typescript
const config = await loadConfig({
  name: 'myapp',
  defaults: {
    port: 3000,
    host: 'localhost',
    logging: {
      level: 'info',
      format: 'json',
    },
  },
  required: ['database.host', 'database.port'],
});

// Throws ConfigError if required fields missing
// Falls back to defaults if not provided
```

### 8. Type-Safe Configuration Access

Full TypeScript support with generic type inference for type-safe access.

#### Type Safety Features

- Generic type parameter for configuration shape
- Type inference for `get()` method
- IDE autocomplete for paths
- Compile-time type checking

#### API Example

```typescript
interface AppConfig {
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    name: string;
  };
}

const config = await loadConfig<AppConfig>({
  name: 'myapp',
});

// Fully typed access
const port: number = config.get('port');
const dbHost: string = config.get('database.host');

// Type-safe path completion
config.get('database.'); // IDE autocomplete: host, port, name
```

---

## Plugin System

### Plugin Interface

```typescript
export interface ConfigPlugin<TContext = ConfigContext> {
  /** Unique plugin identifier (kebab-case) */
  name: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Other plugins this plugin depends on */
  dependencies?: string[];

  /**
   * Called when plugin is registered.
   * @param kernel - The config kernel instance
   */
  install: (kernel: ConfigKernel<TContext>) => void;

  /**
   * Called before config is loaded.
   * Can modify load options.
   */
  onBeforeLoad?: (options: LoadOptions) => LoadOptions | Promise<LoadOptions>;

  /**
   * Called after config is loaded but before merge.
   * Can transform parsed data.
   */
  onAfterParse?: (data: unknown, format: string) => unknown | Promise<unknown>;

  /**
   * Called after all configs are merged.
   * Can validate or transform final config.
   */
  onAfterMerge?: (config: unknown) => unknown | Promise<unknown>;

  /**
   * Called when config value is accessed.
   * Can transform retrieved values.
   */
  onGet?: (path: string, value: unknown) => unknown;

  /**
   * Called when config value is set.
   * Can validate or transform values.
   */
  onSet?: (path: string, value: unknown) => unknown;

  /**
   * Called when config file changes (watch mode).
   */
  onChange?: (event: ConfigChangeEvent) => void | Promise<void>;

  /**
   * Called when plugin is unregistered.
   */
  onDestroy?: () => void | Promise<void>;

  /**
   * Called on error in this plugin.
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}
```

### Plugin Categories

#### Core Plugins (Always Loaded)

| Plugin | Description | Format |
|--------|-------------|--------|
| `json-parser` | Parse JSON configuration files | JSON |
| `env-parser` | Parse .env files and environment variables | ENV |
| `merge` | Deep merge configurations with strategies | All |
| `defaults` | Apply default values to configuration | All |

#### Optional Plugins (Opt-in)

| Plugin | Description | Enable |
|--------|-------------|--------|
| `yaml-parser` | Parse YAML configuration files | `kernel.use(yamlParserPlugin)` |
| `toml-parser` | Parse TOML configuration files | `kernel.use(tomlParserPlugin)` |
| `ini-parser` | Parse INI configuration files | `kernel.use(iniParserPlugin)` |
| `validation` | Schema validation with detailed errors | `kernel.use(validationPlugin({ schema }))` |
| `encryption` | Decrypt encrypted values in config | `kernel.use(encryptionPlugin({ key }))` |
| `watch` | File watching for hot reload | `kernel.use(watchPlugin())` |
| `cache` | Cache parsed configurations | `kernel.use(cachePlugin({ ttl: 60000 }))` |
| `interpolation` | Variable interpolation in values | `kernel.use(interpolationPlugin())` |
| `typescript` | Load TypeScript config files | `kernel.use(typescriptPlugin())` |

---

## API Design

### Main Exports

```typescript
import { loadConfig, createConfig, defineConfig } from '@oxog/config';

// Load config from files
const config = await loadConfig<MyConfig>({
  name: 'myapp',
  paths: ['./config.yaml'],
  env: process.env.NODE_ENV,
});

// Create config programmatically
const config = createConfig<MyConfig>({
  port: 3000,
  host: 'localhost',
});

// Define config schema (for TypeScript)
export default defineConfig({
  port: 3000,
  host: 'localhost',
});
```

### Type Definitions

#### LoadOptions

```typescript
export interface LoadOptions {
  /** Application name (used for env prefix, file naming) */
  name: string;

  /** Paths to config files (resolved relative to cwd) */
  paths?: string[];

  /** Base directory for config files */
  cwd?: string;

  /** Current environment (development, production, etc.) */
  env?: string;

  /** Supported environments for override files */
  environments?: string[];

  /** Environment variable prefix for overrides */
  envPrefix?: string;

  /** Default values */
  defaults?: Record<string, unknown>;

  /** Required field paths */
  required?: string[];

  /** Merge strategy configuration */
  mergeStrategy?: MergeStrategyOptions;

  /** Enable file watching */
  watch?: boolean;

  /** Watch mode options */
  watchOptions?: WatchOptions;

  /** Plugins to use */
  plugins?: ConfigPlugin[];
}
```

#### Config Interface

```typescript
export interface Config<T = unknown> {
  /** Get value at path */
  get<K extends keyof T>(key: K): T[K];
  get<V = unknown>(path: string): V;
  get<V = unknown>(path: string, defaultValue: V): V;

  /** Set value at path */
  set(path: string, value: unknown): void;

  /** Check if path exists */
  has(path: string): boolean;

  /** Delete value at path */
  delete(path: string): boolean;

  /** Get all config as object */
  toObject(): T;

  /** Get all config as JSON string */
  toJSON(): string;

  /** Reload configuration from files */
  reload(): Promise<void>;

  /** Register event listener */
  on<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void;

  /** Remove event listener */
  off<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void;

  /** Start watching files */
  watch(): void;

  /** Stop watching files */
  unwatch(): void;

  /** Register plugin */
  use(plugin: ConfigPlugin): void;

  /** List registered plugins */
  plugins(): string[];
}
```

#### MergeStrategyOptions

```typescript
export interface MergeStrategyOptions {
  /** Default strategy for all values */
  default?: 'replace' | 'merge';

  /** Strategy for arrays */
  arrays?: 'replace' | 'append' | 'prepend' | 'unique';

  /** Path-specific strategies */
  paths?: Record<string, MergeStrategy>;
}
```

#### ConfigChangeEvent

```typescript
export interface ConfigChangeEvent {
  /** Path to changed value */
  path: string;

  /** File that changed */
  file: string;

  /** Previous value */
  oldValue: unknown;

  /** New value */
  newValue: unknown;

  /** Timestamp of change */
  timestamp: number;
}
```

---

## Custom Parser Requirements

### YAML Parser

Must support:
- ✅ Scalar values (strings, numbers, booleans, null)
- ✅ Quoted strings (single and double)
- ✅ Multi-line strings (literal `|` and folded `>`)
- ✅ Arrays (flow `[]` and block `-`)
- ✅ Objects (flow `{}` and block with indentation)
- ✅ Comments (`#`)
- ✅ Anchors and aliases (`&` and `*`)
- ✅ Document separators (`---` and `...`)

### TOML Parser

Must support:
- ✅ Key-value pairs
- ✅ Strings (basic and literal)
- ✅ Multi-line strings
- ✅ Integers and floats
- ✅ Booleans
- ✅ Dates and times
- ✅ Arrays
- ✅ Tables and inline tables
- ✅ Array of tables
- ✅ Comments

### INI Parser

Must support:
- ✅ Key-value pairs
- ✅ Sections `[section]`
- ✅ Nested sections `[section.subsection]`
- ✅ Comments (`;` and `#`)
- ✅ Quoted values
- ✅ Multi-line values (with `\`)

### ENV Parser

Must support:
- ✅ Key-value pairs
- ✅ Quoted values (single and double)
- ✅ Variable expansion (`$VAR` and `${VAR}`)
- ✅ Default values (`${VAR:-default}`)
- ✅ Comments (`#`)
- ✅ Multi-line values
- ✅ Export statements (`export VAR=value`)

---

## Error Handling

### Error Classes

#### ConfigError (Base)

```typescript
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}
```

#### ConfigNotFoundError

Thrown when config file is not found.

```typescript
export class ConfigNotFoundError extends ConfigError {
  constructor(path: string) {
    super(`Config file not found: ${path}`, 'CONFIG_NOT_FOUND', { path });
    this.name = 'ConfigNotFoundError';
  }
}
```

#### ParseError

Thrown when parsing fails with location information.

```typescript
export class ParseError extends ConfigError {
  constructor(
    message: string,
    public readonly file: string,
    public readonly line?: number,
    public readonly column?: number
  ) {
    super(message, 'PARSE_ERROR', { file, line, column });
    this.name = 'ParseError';
  }
}
```

#### ValidationError

Thrown when schema validation fails.

```typescript
export class ValidationError extends ConfigError {
  constructor(
    message: string,
    public readonly errors: ValidationIssue[]
  ) {
    super(message, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}
```

#### RequiredFieldError

Thrown when required field is missing.

```typescript
export class RequiredFieldError extends ConfigError {
  constructor(field: string) {
    super(`Required field missing: ${field}`, 'REQUIRED_MISSING', { field });
    this.name = 'RequiredFieldError';
  }
}
```

#### EncryptionError

Thrown when encryption/decryption fails.

```typescript
export class EncryptionError extends ConfigError {
  constructor(message: string) {
    super(message, 'ENCRYPTION_ERROR');
    this.name = 'EncryptionError';
  }
}
```

#### PluginError

Thrown when plugin operation fails.

```typescript
export class PluginError extends ConfigError {
  constructor(message: string, pluginName: string) {
    super(message, 'PLUGIN_ERROR', { pluginName });
    this.name = 'PluginError';
  }
}
```

---

## Performance Requirements

| Metric | Requirement |
|--------|-------------|
| Bundle Size (core) | < 5KB gzipped |
| Bundle Size (all plugins) | < 15KB gzipped |
| Load Time (simple config) | < 10ms |
| Parse Time (1KB file) | < 5ms |
| Merge Time (10 configs) | < 3ms |

---

## LLM-Native Design

### Requirements

1. **llms.txt file** - < 2000 tokens in project root
2. **Predictable API naming** - Standard patterns LLMs can infer
3. **Rich JSDoc** - `@example` on every public API
4. **15+ examples** - Organized by category
5. **README optimization** - First 500 tokens for LLM consumption

### API Naming Standards

```typescript
// ✅ GOOD - Predictable
loadConfig()     // Load from files
createConfig()   // Create from data
defineConfig()   // Define typed config
get()            // Read value
set()            // Write value
has()            // Check existence
delete()         // Remove value
reload()         // Reload files
watch()          // Start watching
unwatch()        // Stop watching
```

---

## Testing Requirements

### Coverage Requirements

- **Lines:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Statements:** 100%

### Test Categories

1. **Unit Tests**
   - Kernel functionality
   - Config class methods
   - All parsers
   - Utility functions
   - Individual plugins

2. **Integration Tests**
   - loadConfig workflow
   - Environment override resolution
   - Hot reload functionality
   - Plugin combinations

3. **End-to-End Tests**
   - Full-stack configuration loading
   - Real-world scenarios
   - Performance benchmarks

### Test Framework

- **Framework:** Vitest
- **Coverage:** @vitest/coverage-v8
- **Threshold:** 100% (lines, branches, functions, statements)

---

## Bundle and Build Requirements

### Module Formats

- **ESM** - Modern module format
- **CJS** - CommonJS for backward compatibility
- **TypeScript declarations** - Full type definitions

### Build Configuration

- **Bundler:** tsup
- **Tree shaking:** Enabled
- **Source maps:** Enabled
- **Declaration files:** Generated
- **Minification:** Optional (disabled for debugging)

---

## Documentation Requirements

### Required Files

1. **README.md** - Package overview, installation, quick start
2. **SPECIFICATION.md** - Complete feature specification
3. **IMPLEMENTATION.md** - Architecture and design decisions
4. **TASKS.md** - Implementation task list
5. **CHANGELOG.md** - Version history
6. **llms.txt** - LLM-optimized reference

### Website (config.oxog.dev)

#### Technology Stack

- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Syntax Highlighting:** Prism React Renderer
- **Icons:** Lucide React

#### Required Pages

1. **Home** - Hero, features, install, example
2. **Getting Started** - Installation, basic usage, first config
3. **Formats** - JSON, YAML, TOML, INI, ENV documentation
4. **API Reference** - Complete documentation with examples
5. **Plugins** - Core, optional, custom plugin guide
6. **Examples** - Organized by category
7. **Playground** - Interactive config editor

#### Design Requirements

- **IDE-style code blocks** - Line numbers, syntax highlighting, copy buttons
- **Dark/Light theme** - Toggle in navbar, persist in localStorage
- **Mobile responsive** - Works on all screen sizes
- **Footer** - Package name, MIT license, © 2025 Ersin Koç, GitHub link

---

## Example Organization

```
examples/
├── 01-basic/
│   ├── simple-json.ts          # Load JSON config
│   ├── simple-yaml.ts          # Load YAML config
│   ├── with-defaults.ts        # Default values
│   └── README.md
├── 02-formats/
│   ├── json-config.ts          # JSON format
│   ├── yaml-config.ts          # YAML format
│   ├── toml-config.ts          # TOML format
│   ├── ini-config.ts           # INI format
│   ├── env-config.ts           # ENV format
│   └── README.md
├── 03-environments/
│   ├── multi-env.ts            # Multiple environments
│   ├── env-variables.ts        # Env var overrides
│   ├── local-overrides.ts      # Local config files
│   └── README.md
├── 04-plugins/
│   ├── validation.ts           # Schema validation
│   ├── encryption.ts           # Encrypted secrets
│   ├── interpolation.ts        # Variable interpolation
│   ├── custom-plugin.ts        # Custom plugin
│   └── README.md
├── 05-typescript/
│   ├── typed-config.ts         # Full type safety
│   ├── generic-access.ts       # Generic type access
│   ├── define-config.ts        # defineConfig helper
│   └── README.md
├── 06-advanced/
│   ├── hot-reload.ts           # Watch mode
│   ├── merge-strategies.ts     # Custom merge
│   ├── programmatic.ts         # Dynamic config
│   └── README.md
└── 07-real-world/
    ├── express-app/            # Express.js integration
    ├── nextjs-app/             # Next.js integration
    ├── cli-tool/               # CLI tool config
    └── README.md
```

---

## Project Structure

```
config/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Website deploy ONLY
├── src/
│   ├── index.ts                # Main entry, public exports
│   ├── kernel.ts               # Micro kernel core
│   ├── config.ts               # Config class implementation
│   ├── types.ts                # Type definitions
│   ├── errors.ts               # Custom error classes
│   ├── parsers/
│   │   ├── index.ts            # Parser exports
│   │   ├── json.ts             # JSON parser (native)
│   │   ├── yaml.ts             # YAML parser (custom)
│   │   ├── toml.ts             # TOML parser (custom)
│   │   ├── ini.ts              # INI parser (custom)
│   │   └── env.ts              # ENV parser (custom)
│   ├── utils/
│   │   ├── deep-merge.ts       # Deep merge implementation
│   │   ├── path.ts             # Path utilities (get/set/has)
│   │   ├── file.ts             # File system utilities
│   │   └── crypto.ts           # Encryption utilities
│   └── plugins/
│       ├── index.ts            # Plugin exports
│       ├── core/
│       │   ├── json-parser.ts  # Core JSON plugin
│       │   ├── env-parser.ts   # Core ENV plugin
│       │   ├── merge.ts        # Core merge plugin
│       │   └── defaults.ts     # Core defaults plugin
│       └── optional/
│           ├── yaml-parser.ts  # Optional YAML plugin
│           ├── toml-parser.ts  # Optional TOML plugin
│           ├── ini-parser.ts   # Optional INI plugin
│           ├── validation.ts   # Optional validation plugin
│           ├── encryption.ts   # Optional encryption plugin
│           ├── watch.ts        # Optional watch plugin
│           ├── cache.ts        # Optional cache plugin
│           └── interpolation.ts # Optional interpolation plugin
├── tests/
│   ├── unit/
│   │   ├── kernel.test.ts
│   │   ├── config.test.ts
│   │   ├── parsers/
│   │   │   ├── json.test.ts
│   │   │   ├── yaml.test.ts
│   │   │   ├── toml.test.ts
│   │   │   ├── ini.test.ts
│   │   │   └── env.test.ts
│   │   ├── utils/
│   │   │   ├── deep-merge.test.ts
│   │   │   ├── path.test.ts
│   │   │   └── crypto.test.ts
│   │   └── plugins/
│   │       ├── validation.test.ts
│   │       ├── encryption.test.ts
│   │       └── watch.test.ts
│   ├── integration/
│   │   ├── load-config.test.ts
│   │   ├── environment.test.ts
│   │   ├── hot-reload.test.ts
│   │   └── full-stack.test.ts
│   └── fixtures/
│       ├── config.json
│       ├── config.yaml
│       ├── config.toml
│       ├── config.ini
│       ├── .env
│       └── schemas/
├── examples/                   # 15+ organized examples
│   ├── 01-basic/
│   ├── 02-formats/
│   ├── 03-environments/
│   ├── 04-plugins/
│   ├── 05-typescript/
│   ├── 06-advanced/
│   └── 07-real-world/
├── website/                    # React + Vite docs site
│   ├── public/
│   │   ├── CNAME               # config.oxog.dev
│   │   └── llms.txt
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── llms.txt                    # LLM-optimized reference
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── .gitignore
```

---

## Non-Negotiable Rules

### 1. ZERO RUNTIME DEPENDENCIES

```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```

- Implement EVERYTHING from scratch
- No lodash, no js-yaml, no dotenv, no chokidar - nothing
- Write your own YAML parser, TOML parser, INI parser, ENV parser from scratch
- Write your own file watcher, deep merge, encryption utilities
- If you think you need a dependency, you don't

**Allowed devDependencies only:**
- typescript: ^5.0.0
- vitest: ^2.0.0
- @vitest/coverage-v8: ^2.0.0
- tsup: ^8.0.0
- @types/node: ^20.0.0
- prettier: ^3.0.0
- eslint: ^9.0.0

### 2. 100% TEST COVERAGE

- Every line of code must be tested
- Every branch must be tested
- Every function must be tested
- **All tests must pass** (100% success rate)
- Use Vitest for testing
- Coverage thresholds enforced in config

### 3. MICRO-KERNEL ARCHITECTURE

All packages MUST use plugin-based architecture as specified above.

### 4. DEVELOPMENT WORKFLOW

Create these documents **FIRST**, before any code:
1. **SPECIFICATION.md** - Complete package specification ✓
2. **IMPLEMENTATION.md** - Architecture and design decisions
3. **TASKS.md** - Ordered task list with dependencies

Only after all three documents are complete, implement code following TASKS.md sequentially.

### 5. TYPESCRIPT STRICT MODE

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

### 6. LLM-NATIVE DESIGN

Package must be designed for both humans AND AI assistants:
- **llms.txt** file in root (< 2000 tokens)
- **Predictable API** naming (`loadConfig`, `get`, `set`, `use`, `watch`)
- **Rich JSDoc** with @example on every public API
- **15+ examples** organized by category
- **README** optimized for LLM consumption

### 7. NO EXTERNAL LINKS

- ✅ GitHub repository URL
- ✅ Custom domain (config.oxog.dev)
- ✅ npm package URL
- ❌ Social media (Twitter, LinkedIn, etc.)
- ❌ Discord/Slack links
- ❌ Email addresses
- ❌ Donation/sponsor links

---

## Implementation Checklist

### Before Starting
- [x] Create SPECIFICATION.md with complete spec
- [ ] Create IMPLEMENTATION.md with architecture
- [ ] Create TASKS.md with ordered task list
- [ ] All three documents reviewed and complete

### During Implementation
- [ ] Follow TASKS.md sequentially
- [ ] Write tests before or with each feature
- [ ] Maintain 100% coverage throughout
- [ ] JSDoc on every public API with @example
- [ ] Create examples as features are built

### Parser Implementation
- [ ] JSON parser (native, wrapper)
- [ ] YAML parser (custom, from scratch)
- [ ] TOML parser (custom, from scratch)
- [ ] INI parser (custom, from scratch)
- [ ] ENV parser (custom, from scratch)
- [ ] All parsers fully tested

### Plugin Implementation
- [ ] Core plugins (json, env, merge, defaults)
- [ ] Optional plugins (yaml, toml, ini, validation, encryption, watch, cache, interpolation)
- [ ] Plugin lifecycle tested
- [ ] Plugin dependencies resolved

### Package Completion
- [ ] All tests passing (100%)
- [ ] Coverage at 100% (lines, branches, functions)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Package builds without errors

### LLM-Native Completion
- [ ] llms.txt created (< 2000 tokens)
- [ ] llms.txt copied to website/public/
- [ ] README first 500 tokens optimized
- [ ] All public APIs have JSDoc + @example
- [ ] 15+ examples in organized folders
- [ ] package.json has 8-12 keywords
- [ ] API uses standard naming patterns

### Website Completion
- [ ] All pages implemented
- [ ] IDE-style code blocks with line numbers
- [ ] Copy buttons working
- [ ] Dark/Light theme toggle
- [ ] CNAME file with config.oxog.dev
- [ ] Mobile responsive
- [ ] Footer with Ersin Koç, MIT, GitHub only

### Final Verification
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] Website builds without errors
- [ ] All examples run successfully
- [ ] README is complete and accurate
