# @oxog/config Implementation

## Architecture Decisions

### 1. Micro-Kernel Design

#### Rationale

The micro-kernel architecture was chosen for the following reasons:

1. **Extensibility** - New features can be added via plugins without modifying core
2. **Modularity** - Users load only the functionality they need
3. **Testability** - Each component can be tested in isolation
4. **Maintainability** - Clear separation of concerns
5. **Zero Dependencies** - Core remains minimal, reducing attack surface

#### Implementation

The kernel is the central coordinator that:
- Manages plugin lifecycle (register, init, destroy)
- Coordinates inter-plugin communication via event bus
- Handles error boundaries and recovery
- Provides cache management
- Abstracts file system operations

```typescript
// src/kernel.ts
interface ConfigKernel<TContext = ConfigContext> {
  // Plugin registry
  use(plugin: ConfigPlugin<TContext>): void;
  register(name: string, plugin: ConfigPlugin<TContext>): void;
  unregister(name: string): void;
  list(): string[];

  // Event bus
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;

  // Cache
  getCache(key: string): unknown;
  setCache(key: string, value: unknown): void;
  clearCache(key?: string): void;

  // File system
  readFile(path: string): Promise<string>;
  watchFile(path: string, callback: (event: FileWatchEvent) => void): void;
  unwatchFile(path: string): void;
}
```

### 2. Plugin System Design

#### Plugin Lifecycle

```
Registration → Installation → Initialization → Active → Destruction
     ↓              ↓              ↓           ↓         ↓
   register()    install()    onBeforeLoad()  ...   onDestroy()
```

#### Hook Execution Order

1. `onBeforeLoad` - Pre-process load options
2. File loading and parsing
3. `onAfterParse` - Transform parsed data
4. Merge configurations
5. `onAfterMerge` - Final validation/transform
6. `onGet`/`onSet` - Value access hooks

#### Dependency Resolution

Plugins can declare dependencies. The kernel resolves them in topological order:

```typescript
const plugin: ConfigPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: ['json-parser', 'merge'],
  install(kernel) { ... }
};
```

### 3. Parser Architecture

#### Parser Interface

All parsers implement a common interface:

```typescript
interface ConfigParser {
  /** Parse configuration string into object */
  parse(content: string, file: string): unknown;

  /** Serialize object to configuration string */
  stringify(data: unknown): string;

  /** File extensions this parser handles */
  extensions: string[];

  /** Priority (higher numbers checked first) */
  priority: number;
}
```

#### Parser Resolution Strategy

1. Check explicit format override
2. Check file extension against parser extensions
3. Try parsers in priority order
4. Fallback to JSON parser

#### Custom Parser Implementation Details

##### YAML Parser

**Algorithm:** Recursive descent parser with tokenization

**Key Components:**
- `Tokenizer` - Lexical analysis (handles indentation, quotes, anchors)
- `Parser` - Syntactic analysis (builds AST)
- `Transformer` - Converts AST to JavaScript objects

**Supported Features:**
- Block-style and flow-style collections
- Anchors (`&`) and aliases (`*`)
- Multi-line strings (literal `|` and folded `>`)
- Comments (`#`)
- Document separators (`---`, `...`)

**Parsing Strategy:**
```
Input → Tokenizer → Token Stream → Parser → AST → Transformer → Object
```

**Implementation Approach:**
- Track indentation for nesting detection
- Handle quoting rules (single, double, literal)
- Process special characters (`-`, `:`, `|`, `>`, `&`, `*`)
- Resolve anchors and aliases

##### TOML Parser

**Algorithm:** Recursive descent parser optimized for TOML's grammar

**Key Components:**
- `Tokenizer` - Handles TOML-specific tokens (dates, arrays, tables)
- `Parser` - Builds hierarchical structure from tokens
- `Transformer` - Converts to JavaScript objects with type handling

**Supported Features:**
- Basic and literal strings
- Multi-line strings
- Integers, floats, booleans, dates
- Inline tables
- Array of tables

**Parsing Strategy:**
```
Input → Tokenize → Parse Tables → Parse Key-Values → Transform → Object
```

**Implementation Approach:**
- Parse sections as hierarchical keys
- Handle array and inline table syntax
- Parse TOML-specific data types
- Support comments anywhere

##### INI Parser

**Algorithm:** Line-based parser with state tracking

**Key Components:**
- `LineParser` - Processes individual lines
- `SectionManager` - Tracks current section
- `ValueConverter` - Handles type conversion

**Supported Features:**
- Sections `[section]` and nested `[section.subsection]`
- Comments (`;`, `#`)
- Quoted values
- Multi-line values with `\`

**Parsing Strategy:**
```
Input → Split Lines → Parse Sections → Parse Key-Values → Transform → Object
```

**Implementation Approach:**
- Track current section path
- Parse key-value pairs with quotes
- Support continuation lines
- Convert types (boolean, number)

##### ENV Parser

**Algorithm:** Line-based parser with variable expansion

**Key Components:**
- `LineParser` - Handles export statements and comments
- `VariableExpander` - Expands `$VAR` and `${VAR}` patterns
- `DefaultResolver` - Handles `${VAR:-default}` syntax

**Supported Features:**
- Variable expansion
- Default values
- Export statements
- Multi-line values

**Parsing Strategy:**
```
Input → Parse Lines → Expand Variables → Resolve Defaults → Transform → Object
```

**Implementation Approach:**
- Parse key=value pairs
- Handle quoting (single, double)
- Expand environment variables
- Support default values

### 4. Merge Strategy Implementation

#### Deep Merge Algorithm

```typescript
type MergeStrategy = 'replace' | 'merge' | 'append' | 'prepend' | 'unique';

function deepMerge(
  target: unknown,
  source: unknown,
  strategy: MergeStrategy,
  path: string
): unknown {
  // Strategy selection logic
  // Recursive merge implementation
  // Special handling for arrays
}
```

#### Strategy Selection Priority

1. Path-specific strategy (highest priority)
2. Array-specific strategy
3. Default strategy (lowest priority)

#### Array Merge Strategies

- **replace** - `target = source`
- **append** - `target = [...target, ...source]`
- **prepend** - `target = [...source, ...target]`
- **unique** - `target = Array.from(new Set([...target, ...source]))`

### 5. Watch Implementation

#### File Watching Strategy

Use native Node.js `fs.watch()` with fallback to `fs.watchFile()`:

```typescript
interface FileWatcher {
  watch(path: string, callback: (event: FileWatchEvent) => void): void;
  unwatch(path: string): void;
  close(): void;
}
```

#### Debouncing

```typescript
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

#### Event Handling

- **change** - File modified
- **rename** - File renamed/deleted
- **error** - Watch error

### 6. Encryption Implementation

#### Algorithm: AES-256-GCM

```typescript
interface EncryptionOptions {
  key: string;              // Encryption key
  algorithm?: string;       // Default: 'aes-256-gcm'
  marker?: string;          // Default: 'ENC:'
  encoding?: 'base64' | 'hex'; // Default: 'base64'
}
```

#### Encryption Process

```
Key → PBKDF2 → Derived Key
Data → AES-GCM → Ciphertext + IV + Tag
Ciphertext + IV + Tag → Base64 → ENC:...
```

#### Decryption Process

```
ENC:... → Base64 Decode → Ciphertext + IV + Tag
Derived Key + IV + Ciphertext + Tag → AES-GCM → Data
```

### 7. Type System Design

#### Generic Type Parameters

```typescript
interface Config<T = unknown> {
  get<K extends keyof T>(key: K): T[K];
  get<V = unknown>(path: string): V;
  set(path: string, value: unknown): void;
  // ... other methods
}

const config = await loadConfig<AppConfig>({ ... });
// config.get('port') returns number
// config.get('database.host') returns string
```

#### Type Inference Strategy

1. User provides interface: `AppConfig`
2. `loadConfig<AppConfig>` returns `Config<AppConfig>`
3. Generic `get<K>` method provides type safety
4. Path strings benefit from IDE autocomplete

### 8. Event System

#### Event Types

```typescript
type ConfigEvent = 'change' | 'reload' | 'error' | 'watch:start' | 'watch:stop';

interface EventHandler<T = unknown> {
  (event: T): void | Promise<void>;
}
```

#### Event Emission

```typescript
interface Config<T> {
  on<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void;
  off<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void;
}
```

### 9. Error Handling Strategy

#### Error Propagation

```
Parser Error → Plugin Error → Config Error → User
```

Each layer adds context:
- Parser: file, line, column
- Plugin: plugin name
- Config: operation, path

#### Error Recovery

1. **Fatal errors** - Stop execution, throw to user
2. **Non-fatal errors** - Log, continue with fallback
3. **Plugin errors** - Isolate, continue with other plugins

### 10. Performance Optimizations

#### Cache Strategy

```typescript
interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;

  /** Maximum cache size */
  maxSize?: number;

  /** Enable caching */
  enabled?: boolean;
}
```

#### Cache Implementation

- **LRU Cache** - Least Recently Used eviction
- **TTL-based expiration** - Time-based invalidation
- **Memory limits** - Prevent unbounded growth

#### Lazy Loading

- Plugins loaded on-demand
- Parsers only loaded when needed
- Optional features deferred until used

### 11. File Structure Design

#### Module Organization

```
src/
├── index.ts          # Public API exports
├── kernel.ts         # Micro-kernel core
├── config.ts         # Config class
├── types.ts          # Type definitions
├── errors.ts         # Error classes
├── parsers/          # Format parsers
├── utils/            # Utility functions
└── plugins/          # Plugin implementations
```

#### Separation of Concerns

- **Core** - Minimal kernel, essential only
- **Parsers** - Format-specific logic
- **Plugins** - Feature implementations
- **Utils** - Shared utilities
- **Types** - Type definitions only

### 12. Testing Strategy

#### Test Pyramid

```
    /\
   /  \    E2E Tests (10%)
  /____\
 /      \
/        \  Integration Tests (30%)
|        |
|        |
|________|
/          \
/            \  Unit Tests (60%)
/______________\
```

#### Test Organization

```
tests/
├── unit/              # Individual components
│   ├── kernel.test.ts
│   ├── config.test.ts
│   ├── parsers/
│   └── utils/
├── integration/       # Component interaction
│   ├── load-config.test.ts
│   └── environment.test.ts
└── fixtures/          # Test data
    ├── config.json
    └── schemas/
```

#### Coverage Strategy

- **Lines** - Every executable line
- **Branches** - Every if/else path
- **Functions** - Every function
- **Statements** - Every statement

### 13. Build Configuration

#### tsup Configuration

```typescript
export default defineConfig({
  entry: ['src/index.ts', 'src/plugins/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
```

#### Output Structure

```
dist/
├── index.d.ts         # TypeScript declarations (ESM)
├── index.d.cts        # TypeScript declarations (CJS)
├── index.js           # ESM bundle
├── index.cjs          # CJS bundle
├── plugins/
│   ├── index.d.ts
│   ├── index.js
│   └── index.cjs
└── package.json
```

### 14. LLM-Native Design Decisions

#### API Predictability

Standard naming patterns:
- **load** prefix for loading operations
- **create** prefix for creation operations
- **define** prefix for type definitions
- **get/set/has/delete** for CRUD operations

#### Documentation Strategy

- **JSDoc on every public API** - Inline documentation
- **@example tags** - Usage examples in docs
- **@param and @returns** - Complete signatures
- **@throws** - Error documentation

#### llms.txt Structure

```markdown
# Package Name

> Short description

## Install
```bash
npm install @oxog/config
```

## Basic Usage
```typescript
import { loadConfig } from '@oxog/config';
```

## API Summary
- Main functions
- Config methods
- Available plugins

## Common Patterns
- Environment overrides
- Schema validation
- Hot reload
```

### 15. Versioning Strategy

#### Semantic Versioning

- **MAJOR** - Breaking API changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

#### Plugin Versioning

Plugins follow their own version but declare compatibility:

```typescript
const plugin: ConfigPlugin = {
  name: 'yaml-parser',
  version: '1.0.0',
  engineVersion: '^1.0.0', // Compatible config version
};
```

### 16. Security Considerations

#### Input Validation

- Validate file paths (prevent directory traversal)
- Validate configuration values
- Sanitize user-provided content

#### Encryption Best Practices

- Use strong encryption (AES-256-GCM)
- Generate random IVs
- Verify authentication tags
- Derive keys securely (PBKDF2)

#### Secrets Handling

- Never log decrypted values
- Clear memory after use
- Use secure defaults

### 17. Platform Compatibility

#### Node.js Support

- **Minimum version:** 18.x
- **ESM support:** Native
- **Crypto API:** Built-in
- **File watching:** Native

#### File System

- Support both async and sync operations
- Handle different file encodings
- Cross-platform path handling

### 18. Error Recovery Mechanisms

#### Fallback Strategies

1. **Missing files** - Try next path, use defaults
2. **Parse errors** - Skip file, continue with others
3. **Plugin errors** - Disable plugin, continue
4. **Watch errors** - Fallback to polling

#### Graceful Degradation

```
Ideal Config → With Errors → With Missing → With Defaults
    ↓              ↓             ↓            ↓
  Full         Partial       Minimal      Hardcoded
```

### 19. Memory Management

#### Resource Cleanup

- Close file watchers on unwatch()
- Clear caches on clearCache()
- Destroy plugins on unregister()
- Remove event listeners on off()

#### Memory Leak Prevention

- Weak references where appropriate
- Cleanup in finally blocks
- Test for memory leaks

### 20. Future Extensibility

#### Plugin API

Future plugins can add:
- New file formats
- Custom validation rules
- Custom merge strategies
- Custom encryption algorithms
- Custom event handlers

#### Configuration Options

Extensible options object:
```typescript
interface LoadOptions {
  name: string;
  // ... existing options
  [key: string]: unknown; // For future extensions
}
```

---

## Implementation Order

Following the specification requirements, implementation must follow this sequence:

1. **Setup** - Create project structure and config files
2. **Types** - Define all TypeScript interfaces and types
3. **Errors** - Implement error classes
4. **Kernel** - Core micro-kernel implementation
5. **Utils** - Utility functions (deep-merge, path, file, crypto)
6. **Parsers** - Custom format parsers (YAML, TOML, INI, ENV)
7. **Core Plugins** - Essential plugins (json, env, merge, defaults)
8. **Optional Plugins** - Extended features (yaml, toml, ini, validation, encryption, watch, cache, interpolation)
9. **Config Class** - Main configuration interface
10. **Public API** - loadConfig, createConfig, defineConfig
11. **Tests** - Comprehensive test suite
12. **Examples** - 15+ organized examples
13. **Documentation** - README, llms.txt, website
14. **Verification** - 100% test coverage, build success

Each phase must be completed before moving to the next, with tests written alongside implementation.
