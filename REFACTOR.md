# @oxog Package Ecosystem Refactoring Prompt

## Mission

Refactor this existing @oxog package to use the official @oxog ecosystem internal dependencies instead of custom implementations. Replace all custom kernel, plugin system, event emitter, logging, console styling, and CLI code with the standardized @oxog packages.

---

## Core Principle

> **"Don't reinvent the wheel - use the ecosystem."**

The @oxog ecosystem provides 6 battle-tested, production-ready packages that should be used as internal dependencies instead of writing custom implementations.

---

## The 6 Allowed Internal Dependencies

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER                                          │
│  @oxog/cli - CLI framework                                  │
│  Can use: All Foundation + Core packages                    │
├─────────────────────────────────────────────────────────────┤
│  CORE LAYER                                                 │
│  @oxog/pigment - Console colors                             │
│  @oxog/log - Structured logging                             │
│  Can use: Foundation packages only                          │
├─────────────────────────────────────────────────────────────┤
│  FOUNDATION LAYER                                           │
│  @oxog/types - Shared type definitions                      │
│  @oxog/plugin - Micro-kernel plugin system                  │
│  @oxog/emitter - Type-safe event emitter                    │
│  Can use: NONE (zero dependencies)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Package Documentation

Read the `.oxog/` folder in the project root for detailed documentation of each package. If `.oxog/` folder doesn't exist, use the documentation below.

### 1. @oxog/types (Foundation)

**Purpose:** Shared type definitions for the ecosystem.

**Size:** < 1KB (types only, no runtime)

**When to use:** 
- Need `Result<T, E>` for error handling
- Need `Option<T>` for nullable values
- Need standard `Plugin` interface
- Need utility types like `DeepPartial`, `DeepReadonly`, `Prettify`

**Installation:**
```bash
npm install @oxog/types
```

**Usage:**
```typescript
import type { 
  Result,           // Result<T, E> - Error handling
  Option,           // Option<T> - Nullable values  
  Plugin,           // Base plugin interface
  PluginContext,    // Plugin execution context
  AsyncFunction,    // Async function helper
  DeepPartial,      // Deep partial type
  DeepReadonly,     // Deep readonly type
  Prettify,         // Type prettifier
} from '@oxog/types';

// Result type usage
const result: Result<User, Error> = { ok: true, value: user };
if (result.ok) {
  console.log(result.value); // User
} else {
  console.error(result.error); // Error
}

// Option type usage
const option: Option<string> = { some: true, value: 'hello' };
if (option.some) {
  console.log(option.value);
}
```

**Replace these custom implementations:**
- Custom `Result` or `Either` types
- Custom `Option` or `Maybe` types
- Custom plugin interfaces
- Utility type definitions

---

### 2. @oxog/plugin (Foundation)

**Purpose:** Micro-kernel plugin system base.

**Size:** < 2KB

**When to use:**
- Building extensible package with plugin support
- Need lifecycle hooks (init, destroy, error)
- Need dependency resolution between plugins
- Need hook system for extensibility

**Installation:**
```bash
npm install @oxog/plugin
```

**Usage:**
```typescript
import { 
  createKernel,
  definePlugin,
  type Plugin,
  type Kernel,
  type PluginContext 
} from '@oxog/plugin';

// Define a plugin
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: [], // other plugin names
  install: (kernel) => {
    // Register hooks, extend kernel
    kernel.hook('beforeProcess', async (ctx) => {
      console.log('Processing:', ctx.data);
    });
  },
  onInit: async (ctx) => {
    // Called after all plugins installed
  },
  onDestroy: async () => {
    // Cleanup
  },
  onError: (error) => {
    // Error handling
  }
});

// Create kernel and use plugin
const kernel = createKernel({ debug: true });
kernel.use(myPlugin);
await kernel.init();

// Hook system
kernel.hook('customHook', async (data) => {
  return transformedData;
});

// Trigger hooks
const result = await kernel.trigger('customHook', inputData);
```

**Replace these custom implementations:**
- Custom kernel classes
- Custom plugin registry
- Custom hook/middleware systems
- Custom lifecycle management
- Custom dependency resolution

---

### 3. @oxog/emitter (Foundation)

**Purpose:** Type-safe event emitter with async support.

**Size:** < 1.5KB

**When to use:**
- Need pub/sub pattern
- Need typed events
- Need async event handlers
- Need once listeners

**Installation:**
```bash
npm install @oxog/emitter
```

**Usage:**
```typescript
import { createEmitter, type Emitter } from '@oxog/emitter';

// Define event types
interface Events {
  'user:login': { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'error': Error;
  'data:change': { before: unknown; after: unknown };
}

// Create typed emitter
const emitter = createEmitter<Events>();

// Subscribe (fully type-safe)
emitter.on('user:login', (data) => {
  console.log(data.userId);    // ✅ TypeScript knows: string
  console.log(data.timestamp); // ✅ TypeScript knows: number
});

// Once listener (auto-removes after first call)
emitter.once('user:logout', (data) => {
  console.log('Goodbye', data.userId);
});

// Emit (type-safe)
emitter.emit('user:login', { 
  userId: '123', 
  timestamp: Date.now() 
});

// Async emit (waits for all handlers to complete)
await emitter.emitAsync('user:login', { 
  userId: '123', 
  timestamp: Date.now() 
});

// Unsubscribe
const off = emitter.on('error', handler);
off(); // Unsubscribe this specific handler

// Remove all listeners for an event
emitter.off('error');

// Clear all listeners
emitter.clear();

// Get listener count
const count = emitter.listenerCount('user:login');
```

**Replace these custom implementations:**
- Custom EventEmitter classes
- Custom pub/sub systems
- Custom event bus
- Node.js EventEmitter usage (prefer typed version)

---

### 4. @oxog/pigment (Core)

**Purpose:** Console styling with zero dependencies.

**Size:** < 2KB

**When to use:**
- Need colored console output
- Need text styling (bold, italic, underline)
- Need background colors
- Need custom RGB/Hex colors
- Need theme creation

**Installation:**
```bash
npm install @oxog/pigment
```

**Usage:**
```typescript
import { 
  // Basic colors
  red, green, blue, yellow, cyan, magenta, white, black, gray,
  // Bright colors
  brightRed, brightGreen, brightBlue, brightYellow,
  // Styles
  bold, dim, italic, underline, strikethrough, inverse,
  // Background colors
  bgRed, bgGreen, bgBlue, bgYellow,
  // Custom colors
  rgb, hex,
  // Theme creation
  createTheme, createStyler,
  // Color detection
  supportsColor, colorLevel
} from '@oxog/pigment';

// Basic usage
console.log(red('Error!'));
console.log(green('Success!'));
console.log(bold(blue('Important')));

// Chaining/nesting
console.log(bold(red('Critical Error')));
console.log(bgRed(white(bold(' FAIL '))));

// Custom colors
console.log(hex('#ff6b6b')('Custom hex color'));
console.log(rgb(255, 107, 107)('Custom RGB color'));

// Create reusable theme
const theme = createTheme({
  error: (s) => bold(red(s)),
  success: (s) => bold(green(s)),
  warning: (s) => bold(yellow(s)),
  info: (s) => bold(blue(s)),
  muted: (s) => dim(gray(s)),
  highlight: (s) => bgYellow(black(s)),
});

console.log(theme.error('Something went wrong'));
console.log(theme.success('All tests passed'));
console.log(theme.warning('Deprecation notice'));
console.log(theme.muted('Debug info'));

// Check color support
if (supportsColor) {
  console.log(`Color level: ${colorLevel}`); // 1 (basic), 2 (256), or 3 (truecolor)
}

// Create custom styler
const highlight = createStyler([bold, bgYellow, black]);
console.log(highlight('Important text'));
```

**Replace these custom implementations:**
- Custom color functions
- chalk, picocolors, kleur usage
- ANSI escape code handling
- Custom theme systems

---

### 5. @oxog/log (Core)

**Purpose:** Structured logging with levels, formatting, and transports.

**Size:** < 3KB

**Dependencies:** @oxog/pigment

**When to use:**
- Need structured logging
- Need log levels (trace, debug, info, warn, error, fatal)
- Need child loggers with context
- Need multiple transports (console, JSON, file)
- Need timing/performance logging

**Installation:**
```bash
npm install @oxog/log
```

**Usage:**
```typescript
import { 
  createLogger, 
  consoleTransport,
  jsonTransport,
  fileTransport,
  type Logger,
  type LogLevel 
} from '@oxog/log';

// Create logger
const logger = createLogger({
  level: 'debug', // Minimum level to log
  transports: [
    consoleTransport({ 
      colors: true,
      timestamps: true,
      pretty: true 
    }),
    // Optional: JSON transport for production
    // jsonTransport({ stream: process.stdout }),
  ],
  context: { 
    service: 'api', 
    version: '1.0.0',
    env: process.env.NODE_ENV 
  }
});

// Log levels (in order of severity)
logger.trace('Very detailed debugging info');
logger.debug('Debug information');
logger.info('Server started', { port: 3000, host: 'localhost' });
logger.warn('Deprecation warning', { feature: 'oldApi', replacement: 'newApi' });
logger.error('Failed to connect', { error: err, retryCount: 3 });
logger.fatal('Critical failure - shutting down', { reason: 'out of memory' });

// Child loggers (inherit parent context + add own)
const userLogger = logger.child({ module: 'users' });
userLogger.info('User created', { userId: '123', email: 'user@example.com' });
// Output includes: service, version, env, module, userId, email

const authLogger = logger.child({ module: 'auth' });
authLogger.warn('Login failed', { userId: '123', reason: 'invalid_password' });

// Timing helper
const end = logger.time('database-query');
const results = await db.query('SELECT * FROM users');
end(); // Logs: "database-query completed in 42ms"

// Timing with additional context
const endWithContext = logger.time('api-request', { endpoint: '/users' });
await fetch('/api/users');
endWithContext({ statusCode: 200, count: results.length });

// Conditional logging (skip certain logs)
logger.info('Request processed', { 
  path: '/api/users',
  method: 'GET',
  [logger.symbols.skip]: path === '/health' // Skip health check logs
});

// Structured error logging
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error,
    stack: error.stack,
    operation: 'riskyOperation',
    input: { ... }
  });
}
```

**Replace these custom implementations:**
- Custom logger classes
- console.log/warn/error calls (wrap with logger)
- winston, pino, bunyan usage
- Custom log formatting
- Custom transport systems

---

### 6. @oxog/cli (Application)

**Purpose:** CLI framework for building command-line applications.

**Size:** < 5KB

**Dependencies:** @oxog/types, @oxog/plugin, @oxog/pigment, @oxog/log

**When to use:**
- Building CLI application
- Need command parsing
- Need argument/option handling
- Need subcommands
- Need help generation
- Need input validation

**Installation:**
```bash
npm install @oxog/cli
```

**Usage:**
```typescript
import { 
  createCLI, 
  command, 
  option, 
  argument,
  type CLI,
  type Command 
} from '@oxog/cli';

// Create CLI app
const cli = createCLI({
  name: 'myapp',
  version: '1.0.0',
  description: 'My awesome CLI application',
});

// Simple command
cli.command(
  command('hello')
    .description('Say hello')
    .action(async ({ logger }) => {
      logger.info('Hello, World!');
    })
);

// Command with arguments and options
cli.command(
  command('greet')
    .description('Greet someone')
    .argument(
      argument('name')
        .description('Name to greet')
        .required()
    )
    .option(
      option('--shout', '-s')
        .description('Shout the greeting')
        .boolean()
        .default(false)
    )
    .option(
      option('--times', '-t')
        .description('Number of times to greet')
        .number()
        .default(1)
    )
    .option(
      option('--color', '-c')
        .description('Color of the greeting')
        .choices(['red', 'green', 'blue'])
        .default('green')
    )
    .action(async ({ args, options, logger }) => {
      const greeting = `Hello, ${args.name}!`;
      const output = options.shout ? greeting.toUpperCase() : greeting;
      
      for (let i = 0; i < options.times; i++) {
        logger.info(output);
      }
    })
);

// Subcommands
cli.command(
  command('user')
    .description('User management')
    .subcommand(
      command('create')
        .description('Create a new user')
        .argument(argument('email').required().description('User email'))
        .option(option('--admin').boolean().description('Make user admin'))
        .action(async ({ args, options, logger }) => {
          logger.info('Creating user', { email: args.email, admin: options.admin });
          // ... create user
        })
    )
    .subcommand(
      command('delete')
        .description('Delete a user')
        .argument(argument('id').required().description('User ID'))
        .option(option('--force', '-f').boolean().description('Skip confirmation'))
        .action(async ({ args, options, logger }) => {
          if (!options.force) {
            // ... prompt for confirmation
          }
          logger.info('Deleting user', { id: args.id });
          // ... delete user
        })
    )
    .subcommand(
      command('list')
        .description('List all users')
        .option(option('--json').boolean().description('Output as JSON'))
        .option(option('--limit', '-l').number().default(10))
        .action(async ({ options, logger }) => {
          const users = await getUsers({ limit: options.limit });
          if (options.json) {
            console.log(JSON.stringify(users, null, 2));
          } else {
            users.forEach(u => logger.info(`${u.id}: ${u.email}`));
          }
        })
    )
);

// Global options (available to all commands)
cli.option(
  option('--verbose', '-v')
    .description('Enable verbose output')
    .boolean()
    .global()
);

cli.option(
  option('--config', '-c')
    .description('Config file path')
    .string()
    .global()
);

// Run CLI
cli.run(process.argv);

// Or run with custom args (useful for testing)
cli.run(['node', 'myapp', 'greet', 'World', '--shout', '--times', '3']);
```

**Replace these custom implementations:**
- Custom argument parsing
- commander, yargs, meow usage
- Custom help generation
- Custom command routing
- process.argv manual parsing

---

## Refactoring Process

### Step 1: Analyze Current Implementation

First, identify what custom implementations exist:

```bash
# Search for custom implementations
grep -r "class.*Kernel" src/
grep -r "class.*Plugin" src/
grep -r "class.*Emitter" src/
grep -r "class.*Logger" src/
grep -r "EventEmitter" src/
grep -r "console\." src/
grep -r "chalk\|picocolors\|kleur" src/
grep -r "commander\|yargs\|meow" src/
```

### Step 2: Create Migration Map

Document what needs to be replaced:

| Current Implementation | Replace With | Notes |
|------------------------|--------------|-------|
| `src/kernel.ts` | `@oxog/plugin` | Use `createKernel` |
| `src/plugin.ts` | `@oxog/plugin` | Use `definePlugin` |
| `src/emitter.ts` | `@oxog/emitter` | Use `createEmitter` |
| `src/logger.ts` | `@oxog/log` | Use `createLogger` |
| `src/colors.ts` | `@oxog/pigment` | Import color functions |
| `src/cli.ts` | `@oxog/cli` | Use `createCLI` |
| `src/types.ts` | `@oxog/types` | Import shared types |

### Step 3: Install Dependencies

```bash
# Install only what you need
npm install @oxog/types @oxog/plugin @oxog/emitter @oxog/pigment @oxog/log @oxog/cli

# Or install specific packages
npm install @oxog/plugin  # If only need plugin system
npm install @oxog/emitter # If only need event emitter
```

### Step 4: Refactor in Order

**IMPORTANT:** Refactor in this order to avoid breaking changes:

1. **Types first** - Replace custom types with `@oxog/types`
2. **Foundation packages** - Replace kernel/plugin/emitter
3. **Core packages** - Replace colors/logging
4. **Application packages** - Replace CLI last

### Step 5: Update Exports

Ensure your package exports remain compatible:

```typescript
// src/index.ts

// Re-export types (if needed by consumers)
export type { Plugin, PluginContext, Result, Option } from '@oxog/types';

// Export your package's functionality
export { createMyPackage } from './my-package';
export { myPlugin } from './plugins';
```

---

## Migration Examples

### Example 1: Custom Kernel → @oxog/plugin

**Before:**
```typescript
// src/kernel.ts
export class Kernel {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Function[]> = new Map();

  use(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.install(this);
  }

  hook(name: string, fn: Function) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name)!.push(fn);
  }

  async trigger(name: string, data: unknown) {
    const hooks = this.hooks.get(name) || [];
    let result = data;
    for (const hook of hooks) {
      result = await hook(result);
    }
    return result;
  }

  async init() {
    for (const plugin of this.plugins.values()) {
      await plugin.onInit?.();
    }
  }

  async destroy() {
    for (const plugin of this.plugins.values()) {
      await plugin.onDestroy?.();
    }
  }
}
```

**After:**
```typescript
// src/kernel.ts
import { createKernel, definePlugin, type Kernel, type Plugin } from '@oxog/plugin';

// Re-export for consumers
export { createKernel, definePlugin };
export type { Kernel, Plugin };

// Create pre-configured kernel for this package
export function createMyPackageKernel(options?: MyPackageOptions) {
  const kernel = createKernel({
    debug: options?.debug ?? false,
  });

  // Add default plugins
  kernel.use(corePlugin);
  
  if (options?.enableCache) {
    kernel.use(cachePlugin);
  }

  return kernel;
}
```

### Example 2: Custom EventEmitter → @oxog/emitter

**Before:**
```typescript
// src/emitter.ts
import { EventEmitter } from 'events';

export class TypedEmitter<T extends Record<string, unknown>> extends EventEmitter {
  emit<K extends keyof T>(event: K, data: T[K]): boolean {
    return super.emit(event as string, data);
  }

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): this {
    return super.on(event as string, listener);
  }
}
```

**After:**
```typescript
// src/emitter.ts
import { createEmitter, type Emitter } from '@oxog/emitter';

// Define your package's events
export interface MyPackageEvents {
  'task:start': { taskId: string; timestamp: number };
  'task:complete': { taskId: string; duration: number; result: unknown };
  'task:error': { taskId: string; error: Error };
  'queue:empty': void;
}

// Export typed emitter creator
export function createMyPackageEmitter() {
  return createEmitter<MyPackageEvents>();
}

// Re-export for consumers
export { createEmitter };
export type { Emitter };
```

### Example 3: Custom Logger → @oxog/log

**Before:**
```typescript
// src/logger.ts
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export class Logger {
  constructor(private level: string = 'info') {}

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  private shouldLog(level: string): boolean {
    return LOG_LEVELS.indexOf(level as any) >= LOG_LEVELS.indexOf(this.level as any);
  }
}
```

**After:**
```typescript
// src/logger.ts
import { createLogger, consoleTransport, type Logger, type LogLevel } from '@oxog/log';

// Create package-specific logger
export function createMyPackageLogger(options?: { level?: LogLevel; debug?: boolean }) {
  return createLogger({
    level: options?.debug ? 'debug' : (options?.level ?? 'info'),
    transports: [
      consoleTransport({ 
        colors: true, 
        timestamps: true,
        pretty: process.env.NODE_ENV !== 'production'
      }),
    ],
    context: { 
      package: '@oxog/my-package',
    }
  });
}

// Re-export for consumers
export { createLogger };
export type { Logger, LogLevel };
```

### Example 4: Custom Colors → @oxog/pigment

**Before:**
```typescript
// src/colors.ts
import chalk from 'chalk';

export const error = chalk.bold.red;
export const success = chalk.bold.green;
export const warning = chalk.bold.yellow;
export const info = chalk.bold.blue;
```

**After:**
```typescript
// src/colors.ts
import { bold, red, green, yellow, blue, createTheme } from '@oxog/pigment';

// Create theme
export const theme = createTheme({
  error: (s) => bold(red(s)),
  success: (s) => bold(green(s)),
  warning: (s) => bold(yellow(s)),
  info: (s) => bold(blue(s)),
});

// Or export individual functions
export const error = (s: string) => bold(red(s));
export const success = (s: string) => bold(green(s));
export const warning = (s: string) => bold(yellow(s));
export const info = (s: string) => bold(blue(s));

// Re-export pigment for consumers
export * from '@oxog/pigment';
```

### Example 5: Custom CLI → @oxog/cli

**Before:**
```typescript
// src/cli.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('myapp')
  .version('1.0.0')
  .description('My CLI app');

program
  .command('run <task>')
  .option('-v, --verbose', 'Verbose output')
  .action((task, options) => {
    console.log(`Running ${task}`);
  });

program.parse();
```

**After:**
```typescript
// src/cli.ts
import { createCLI, command, argument, option } from '@oxog/cli';

const cli = createCLI({
  name: 'myapp',
  version: '1.0.0',
  description: 'My CLI app',
});

cli.command(
  command('run')
    .description('Run a task')
    .argument(
      argument('task')
        .description('Task to run')
        .required()
    )
    .option(
      option('--verbose', '-v')
        .description('Verbose output')
        .boolean()
    )
    .action(async ({ args, options, logger }) => {
      logger.info(`Running ${args.task}`);
    })
);

// Export for bin file
export { cli };

// bin/myapp.ts
#!/usr/bin/env node
import { cli } from '../src/cli';
cli.run(process.argv);
```

---

## Package.json Updates

Update your package.json dependencies:

```json
{
  "name": "@oxog/your-package",
  "version": "1.0.0",
  "dependencies": {
    "@oxog/types": "^1.0.0",
    "@oxog/plugin": "^1.0.0",
    "@oxog/emitter": "^1.0.0",
    "@oxog/pigment": "^1.0.0",
    "@oxog/log": "^1.0.0",
    "@oxog/cli": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**Remove these dependencies if present:**
```json
{
  "dependencies": {
    "chalk": "❌ REMOVE - use @oxog/pigment",
    "picocolors": "❌ REMOVE - use @oxog/pigment",
    "kleur": "❌ REMOVE - use @oxog/pigment",
    "winston": "❌ REMOVE - use @oxog/log",
    "pino": "❌ REMOVE - use @oxog/log",
    "bunyan": "❌ REMOVE - use @oxog/log",
    "commander": "❌ REMOVE - use @oxog/cli",
    "yargs": "❌ REMOVE - use @oxog/cli",
    "meow": "❌ REMOVE - use @oxog/cli",
    "eventemitter3": "❌ REMOVE - use @oxog/emitter"
  }
}
```

---

## Refactoring Checklist

### Analysis
- [ ] Identified all custom kernel/plugin implementations
- [ ] Identified all custom event emitter implementations
- [ ] Identified all custom logger implementations
- [ ] Identified all color/styling libraries in use
- [ ] Identified all CLI libraries in use
- [ ] Created migration map

### Dependencies
- [ ] Installed required @oxog packages
- [ ] Removed replaced dependencies (chalk, winston, commander, etc.)
- [ ] Updated package.json

### Code Migration
- [ ] Migrated types to @oxog/types
- [ ] Migrated kernel/plugin system to @oxog/plugin
- [ ] Migrated event emitter to @oxog/emitter
- [ ] Migrated colors to @oxog/pigment
- [ ] Migrated logger to @oxog/log
- [ ] Migrated CLI to @oxog/cli (if applicable)

### Testing
- [ ] Updated tests to use new implementations
- [ ] All tests passing
- [ ] 100% code coverage maintained

### Cleanup
- [ ] Removed old custom implementation files
- [ ] Updated exports in index.ts
- [ ] Updated documentation/README
- [ ] Updated examples

### Final Verification
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes with 100% coverage
- [ ] No TypeScript errors
- [ ] Bundle size within budget

---

## Important Notes

### DO NOT
- ❌ Use @oxog/utils as internal dependency (standalone only)
- ❌ Use @oxog/codeshine as internal dependency (standalone only)
- ❌ Use any external packages (lodash, axios, etc.)
- ❌ Break the layer hierarchy (Core can't use Application)

### DO
- ✅ Only use the 6 allowed internal dependencies
- ✅ Follow the layer hierarchy
- ✅ Re-export types for consumers if needed
- ✅ Maintain backward compatibility where possible
- ✅ Update tests after each migration step
- ✅ Document breaking changes

---

## Support

If you need documentation for any of the 6 packages:

1. Check `.oxog/` folder in the project root
2. Check `node_modules/@oxog/{package}/README.md`
3. Check `https://{package}.oxog.dev`

---

## Begin Refactoring

Start by analyzing the current codebase, then follow the migration steps in order:

1. **Types** → @oxog/types
2. **Plugin/Kernel** → @oxog/plugin  
3. **Events** → @oxog/emitter
4. **Colors** → @oxog/pigment
5. **Logging** → @oxog/log
6. **CLI** → @oxog/cli

Maintain tests and coverage throughout the process.