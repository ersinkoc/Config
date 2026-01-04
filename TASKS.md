# Implementation Tasks

This document contains the complete ordered task list for implementing `@oxog/config`. Follow tasks sequentially. Each task must be completed (including tests) before moving to the next.

---

## Phase 1: Project Setup

### Task 1.1: Create Project Structure
- [ ] Create directory structure:
  ```
  src/
  ├── parsers/
  ├── utils/
  ├── plugins/
  │   ├── core/
  │   └── optional/
  tests/
  ├── unit/
  │   ├── parsers/
  │   ├── utils/
  │   └── plugins/
  ├── integration/
  fixtures/
  examples/
  ├── 01-basic/
  ├── 02-formats/
  ├── 03-environments/
  ├── 04-plugins/
  ├── 05-typescript/
  ├── 06-advanced/
  └── 07-real-world/
  website/
  ├── public/
  └── src/
  ```

### Task 1.2: Create Configuration Files
- [ ] Create `package.json` with all dependencies and scripts
- [ ] Create `tsconfig.json` with strict TypeScript settings
- [ ] Create `tsup.config.ts` for bundling
- [ ] Create `vitest.config.ts` with 100% coverage threshold
- [ ] Create `.gitignore` file
- [ ] Create `LICENSE` (MIT)
- [ ] Create `CHANGELOG.md`

### Task 1.3: Create Test Fixtures
- [ ] Create `tests/fixtures/config.json`
- [ ] Create `tests/fixtures/config.yaml`
- [ ] Create `tests/fixtures/config.toml`
- [ ] Create `tests/fixtures/config.ini`
- [ ] Create `tests/fixtures/.env`
- [ ] Create `tests/fixtures/schemas/basic-schema.json`

---

## Phase 2: Core Types and Errors

### Task 2.1: Implement Error Classes
Create `src/errors.ts`:
- [ ] `ConfigError` (base class)
- [ ] `ConfigNotFoundError`
- [ ] `ParseError`
- [ ] `ValidationError`
- [ ] `RequiredFieldError`
- [ ] `EncryptionError`
- [ ] `PluginError`

### Task 2.2: Implement Core Types
Create `src/types.ts`:
- [ ] `LoadOptions` interface
- [ ] `Config<T>` interface
- [ ] `ConfigEvent` type
- [ ] `ConfigChangeEvent` interface
- [ ] `MergeStrategyOptions` interface
- [ ] `WatchOptions` interface
- [ ] `ValidationIssue` interface
- [ ] `FileWatchEvent` interface
- [ ] `PluginContext` type
- [ ] All necessary type guards and helpers

---

## Phase 3: Utility Functions

### Task 3.1: Path Utilities
Create `src/utils/path.ts`:
- [ ] `get(obj, path, default?)` - Get nested value
- [ ] `set(obj, path, value)` - Set nested value
- [ ] `has(obj, path)` - Check if path exists
- [ ] `delete(obj, path)` - Delete nested value
- [ ] `toPathSegments(path)` - Convert dot notation to segments
- [ ] Tests for all functions

### Task 3.2: Deep Merge Utility
Create `src/utils/deep-merge.ts`:
- [ ] `deepMerge(target, source, strategy, path)` - Core merge logic
- [ ] `selectStrategy(path, strategies)` - Strategy selection
- [ ] `mergeArrays(target, source, strategy)` - Array merge
- [ ] Tests for all strategies (replace, merge, append, prepend, unique)

### Task 3.3: File System Utilities
Create `src/utils/file.ts`:
- [ ] `readFile(path)` - Async file read
- [ ] `exists(path)` - Check file existence
- [ ] `resolvePaths(paths, cwd)` - Resolve relative paths
- [ ] `findConfigFiles(name, cwd, env)` - Find config files
- [ ] `detectFormat(filePath, explicit?)` - Detect file format
- [ ] Tests for all functions

### Task 3.4: Encryption Utilities
Create `src/utils/crypto.ts`:
- [ ] `deriveKey(password, salt)` - PBKDF2 key derivation
- [ ] `encrypt(data, key, algorithm)` - AES-256-GCM encryption
- [ ] `decrypt(ciphertext, key, algorithm, iv, tag)` - Decryption
- [ ] `generateSalt()` - Random salt generation
- [ ] `generateIV()` - Random IV generation
- [ ] Tests for encryption/decryption

---

## Phase 4: Custom Parsers

### Task 4.1: JSON Parser
Create `src/parsers/json.ts`:
- [ ] Implement `parse(content, file)` - Wrap native JSON.parse
- [ ] Implement `stringify(data)` - Wrap JSON.stringify
- [ ] Register with extensions: `['.json']`
- [ ] Set priority: 50
- [ ] Tests for parse/stringify

### Task 4.2: YAML Parser
Create `src/parsers/yaml.ts`:
- [ ] Implement `Tokenizer` class
  - [ ] Tokenize: strings, numbers, booleans, null
  - [ ] Handle quoted strings (single, double)
  - [ ] Handle multi-line strings (|, >)
  - [ ] Handle comments (#)
  - [ ] Handle anchors (&) and aliases (*)
- [ ] Implement `Parser` class
  - [ ] Parse objects (block and flow {})
  - [ ] Parse arrays (block - and flow [])
  - [ ] Handle document separators (---, ...)
  - [ ] Build AST from tokens
- [ ] Implement `transform(ast)` - Convert AST to object
- [ ] Implement `stringify(data)` - Serialize to YAML
- [ ] Register with extensions: `['.yaml', '.yml']`
- [ ] Set priority: 60
- [ ] Comprehensive tests with all YAML features

### Task 4.3: TOML Parser
Create `src/parsers/toml.ts`:
- [ ] Implement `Tokenizer` class
  - [ ] Tokenize: strings, integers, floats, booleans, dates
  - [ ] Handle basic and literal strings
  - [ ] Handle multi-line strings
  - [ ] Handle comments
- [ ] Implement `Parser` class
  - [ ] Parse tables [section]
  - [ ] Parse inline tables {key=value}
  - [ ] Parse arrays
  - [ ] Parse array of tables [[section]]
  - [ ] Build hierarchical structure
- [ ] Implement `transform(data)` - Convert to object
- [ ] Implement `stringify(data)` - Serialize to TOML
- [ ] Register with extensions: `['.toml']`
- [ ] Set priority: 60
- [ ] Comprehensive tests with all TOML features

### Task 4.4: INI Parser
Create `src/parsers/ini.ts`:
- [ ] Implement `LineParser` class
  - [ ] Parse sections [section]
  - [ ] Parse nested sections [section.subsection]
  - [ ] Parse key-value pairs
  - [ ] Handle comments (;, #)
  - [ ] Handle quoted values
  - [ ] Handle multi-line values with \
- [ ] Implement `transform(data)` - Convert to nested object
- [ ] Implement `stringify(data)` - Serialize to INI
- [ ] Register with extensions: `['.ini']`
- [ ] Set priority: 60
- [ ] Comprehensive tests with all INI features

### Task 4.5: ENV Parser
Create `src/parsers/env.ts`:
- [ ] Implement `LineParser` class
  - [ ] Parse key-value pairs
  - [ ] Handle export statements
  - [ ] Handle comments (#)
  - [ ] Handle quoted values (single, double)
- [ ] Implement `VariableExpander` class
  - [ ] Expand $VAR patterns
  - [ ] Expand ${VAR} patterns
  - [ ] Handle default values ${VAR:-default}
- [ ] Implement `transform(data)` - Convert to object
- [ ] Implement `stringify(data)` - Serialize to ENV
- [ ] Register with extensions: `['.env']`
- [ ] Register with environment variable detection
- [ ] Set priority: 70 (check before others for .env)
- [ ] Comprehensive tests with all ENV features

### Task 4.6: Parser Registry
Create `src/parsers/index.ts`:
- [ ] `ParserRegistry` class
  - [ ] `register(parser)` - Add parser
  - [ ] `unregister(extensions)` - Remove parser
  - [ ] `get(format)` - Get parser by format
  - [ ] `detect(filePath)` - Detect by file extension
- [ ] Export all parsers
- [ ] Tests for registry

---

## Phase 5: Micro-Kernel

### Task 5.1: Implement Event Bus
Create `src/kernel/events.ts`:
- [ ] `EventBus` class
  - [ ] `on(event, handler)` - Subscribe to event
  - [ ] `off(event, handler)` - Unsubscribe
  - [ ] `emit(event, data)` - Emit event
  - [ ] `once(event, handler)` - One-time listener
  - [ ] `removeAllListeners(event?)` - Clean up
- [ ] Tests for event bus

### Task 5.2: Implement Cache
Create `src/kernel/cache.ts`:
- [ ] `Cache` class with LRU eviction
  - [ ] `get(key)` - Retrieve value
  - [ ] `set(key, value, ttl?)` - Store value
  - [ ] `delete(key)` - Remove value
  - [ ] `clear()` - Empty cache
  - [ ] `has(key)` - Check existence
- [ ] Tests for cache

### Task 5.3: Implement File Watcher
Create `src/kernel/watcher.ts`:
- [ ] `FileWatcher` class
  - [ ] `watch(path, callback)` - Start watching
  - [ ] `unwatch(path)` - Stop watching
  - [ ] `close()` - Clean up all watchers
  - [ ] Handle debouncing
  - [ ] Handle file rename/delete
- [ ] Platform-specific optimizations
- [ ] Tests for file watching

### Task 5.4: Implement Plugin Manager
Create `src/kernel/plugins.ts`:
- [ ] `PluginManager` class
  - [ ] `register(plugin)` - Register plugin
  - [ ] `unregister(name)` - Unregister plugin
  - [ ] `use(plugin)` - Install plugin
  - [ ] `list()` - List registered plugins
  - [ ] `resolveDependencies()` - Handle plugin deps
  - [ ] Call plugin lifecycle hooks
- [ ] Tests for plugin management

### Task 5.5: Implement Kernel Core
Create `src/kernel.ts`:
- [ ] `ConfigKernel` class
  - [ ] Integrate EventBus
  - [ ] Integrate Cache
  - [ ] Integrate FileWatcher
  - [ ] Integrate PluginManager
  - [ ] Provide unified API
- [ ] Tests for kernel

---

## Phase 6: Core Plugins

### Task 6.1: JSON Parser Plugin
Create `src/plugins/core/json-parser.ts`:
- [ ] Implement plugin interface
- [ ] Wrap JSON parser
- [ ] Register on installation
- [ ] Tests

### Task 6.2: ENV Parser Plugin
Create `src/plugins/core/env-parser.ts`:
- [ ] Implement plugin interface
- [ ] Wrap ENV parser
- [ ] Handle environment variables
- [ ] Tests

### Task 6.3: Merge Plugin
Create `src/plugins/core/merge.ts`:
- [ ] Implement plugin interface
- [ ] Provide merge strategy configuration
- [ ] Execute onAfterMerge hook
- [ ] Tests

### Task 6.4: Defaults Plugin
Create `src/plugins/core/defaults.ts`:
- [ ] Implement plugin interface
- [ ] Apply default values
- [ ] Validate required fields
- [ ] Tests

---

## Phase 7: Optional Plugins

### Task 7.1: YAML Parser Plugin
Create `src/plugins/optional/yaml-parser.ts`:
- [ ] Implement plugin interface
- [ ] Wrap YAML parser
- [ ] Tests

### Task 7.2: TOML Parser Plugin
Create `src/plugins/optional/toml-parser.ts`:
- [ ] Implement plugin interface
- [ ] Wrap TOML parser
- [ ] Tests

### Task 7.3: INI Parser Plugin
Create `src/plugins/optional/ini-parser.ts`:
- [ ] Implement plugin interface
- [ ] Wrap INI parser
- [ ] Tests

### Task 7.4: Validation Plugin
Create `src/plugins/optional/validation.ts`:
- [ ] Implement plugin interface
- [ ] JSON Schema validation
- [ ] Custom validators
- [ ] Detailed error reporting
- [ ] Tests

### Task 7.5: Encryption Plugin
Create `src/plugins/optional/encryption.ts`:
- [ ] Implement plugin interface
- [ ] Detect encrypted values (marker)
- [ ] Decrypt on access
- [ ] Encrypt on set
- [ ] Tests

### Task 7.6: Watch Plugin
Create `src/plugins/optional/watch.ts`:
- [ ] Implement plugin interface
- [ ] Wrap file watcher
- [ ] Emit change events
- [ ] Auto-reload on change
- [ ] Tests

### Task 7.7: Cache Plugin
Create `src/plugins/optional/cache.ts`:
- [ ] Implement plugin interface
- [ ] Cache parsed configurations
- [ ] TTL-based expiration
- [ ] Tests

### Task 7.8: Interpolation Plugin
Create `src/plugins/optional/interpolation.ts`:
- [ ] Implement plugin interface
- [ ] Variable interpolation ${VAR}
- [ ] Default value support ${VAR:-default}
- [ ] Tests

### Task 7.9: TypeScript Plugin (Optional)
Create `src/plugins/optional/typescript.ts`:
- [ ] Implement plugin interface
- [ ] Load .ts and .mts files
- [ ] Safe evaluation without esbuild
- [ ] Tests

### Task 7.10: Plugin Registry
Create `src/plugins/index.ts`:
- [ ] Export all plugins
- [ ] Plugin factory functions
- [ ] Type definitions
- [ ] Tests

---

## Phase 8: Config Class

### Task 8.1: Implement Config Class
Create `src/config.ts`:
- [ ] `Config<T>` class
  - [ ] `get(path, default?)` - Get value
  - [ ] `set(path, value)` - Set value
  - [ ] `has(path)` - Check existence
  - [ ] `delete(path)` - Delete value
  - [ ] `toObject()` - Convert to object
  - [ ] `toJSON()` - Convert to JSON string
  - [ ] `reload()` - Reload from files
  - [ ] `on(event, handler)` - Event listener
  - [ ] `off(event, handler)` - Remove listener
  - [ ] `watch()` - Start watching
  - [ ] `unwatch()` - Stop watching
  - [ ] `use(plugin)` - Register plugin
  - [ ] `plugins()` - List plugins
- [ ] Tests for all methods

---

## Phase 9: Public API

### Task 9.1: Implement Main Exports
Create `src/index.ts`:
- [ ] `loadConfig<T>(options)` - Load from files
- [ ] `createConfig<T>(data)` - Create from object
- [ ] `defineConfig<T>(data)` - Define typed config
- [ ] Export all types
- [ ] Export error classes
- [ ] Tests for all exports

### Task 9.2: Implement Environment Resolution
- [ ] `resolveEnvironmentFiles(name, env, cwd)` - Find env files
- [ ] `mergeEnvironmentOverrides(config, env, prefix)` - Apply env vars
- [ ] Tests for environment resolution

---

## Phase 10: Testing (Comprehensive)

### Task 10.1: Unit Tests - Core
- [ ] `tests/unit/kernel.test.ts` - Kernel tests
- [ ] `tests/unit/config.test.ts` - Config class tests
- [ ] `tests/unit/types.test.ts` - Type guards tests
- [ ] `tests/unit/errors.test.ts` - Error class tests

### Task 10.2: Unit Tests - Parsers
- [ ] `tests/unit/parsers/json.test.ts` - JSON parser tests
- [ ] `tests/unit/parsers/yaml.test.ts` - YAML parser tests (comprehensive)
- [ ] `tests/unit/parsers/toml.test.ts` - TOML parser tests (comprehensive)
- [ ] `tests/unit/parsers/ini.test.ts` - INI parser tests (comprehensive)
- [ ] `tests/unit/parsers/env.test.ts` - ENV parser tests (comprehensive)

### Task 10.3: Unit Tests - Utils
- [ ] `tests/unit/utils/path.test.ts` - Path utility tests
- [ ] `tests/unit/utils/deep-merge.test.ts` - Deep merge tests
- [ ] `tests/unit/utils/file.test.ts` - File utility tests
- [ ] `tests/unit/utils/crypto.test.ts` - Crypto utility tests

### Task 10.4: Unit Tests - Plugins
- [ ] `tests/unit/plugins/core/*.test.ts` - Core plugin tests
- [ ] `tests/unit/plugins/optional/*.test.ts` - Optional plugin tests

### Task 10.5: Integration Tests
- [ ] `tests/integration/load-config.test.ts` - Full load workflow
- [ ] `tests/integration/environment.test.ts` - Environment overrides
- [ ] `tests/integration/hot-reload.test.ts` - File watching
- [ ] `tests/integration/full-stack.test.ts` - End-to-end tests

### Task 10.6: Coverage Verification
- [ ] Run `npm run test:coverage`
- [ ] Verify 100% lines
- [ ] Verify 100% branches
- [ ] Verify 100% functions
- [ ] Fix any gaps

---

## Phase 11: Examples (15+ Examples)

### Task 11.1: Basic Examples (01-basic/)
- [ ] `examples/01-basic/simple-json.ts` - Load JSON config
- [ ] `examples/01-basic/simple-yaml.ts` - Load YAML config
- [ ] `examples/01-basic/with-defaults.ts` - Default values
- [ ] `examples/01-basic/README.md` - Documentation

### Task 11.2: Format Examples (02-formats/)
- [ ] `examples/02-formats/json-config.ts` - JSON format
- [ ] `examples/02-formats/yaml-config.ts` - YAML format
- [ ] `examples/02-formats/toml-config.ts` - TOML format
- [ ] `examples/02-formats/ini-config.ts` - INI format
- [ ] `examples/02-formats/env-config.ts` - ENV format
- [ ] `examples/02-formats/README.md` - Documentation

### Task 11.3: Environment Examples (03-environments/)
- [ ] `examples/03-environments/multi-env.ts` - Multiple environments
- [ ] `examples/03-environments/env-variables.ts` - Env var overrides
- [ ] `examples/03-environments/local-overrides.ts` - Local config files
- [ ] `examples/03-environments/README.md` - Documentation

### Task 11.4: Plugin Examples (04-plugins/)
- [ ] `examples/04-plugins/validation.ts` - Schema validation
- [ ] `examples/04-plugins/encryption.ts` - Encrypted secrets
- [ ] `examples/04-plugins/interpolation.ts` - Variable interpolation
- [ ] `examples/04-plugins/custom-plugin.ts` - Custom plugin
- [ ] `examples/04-plugins/README.md` - Documentation

### Task 11.5: TypeScript Examples (05-typescript/)
- [ ] `examples/05-typescript/typed-config.ts` - Full type safety
- [ ] `examples/05-typescript/generic-access.ts` - Generic type access
- [ ] `examples/05-typescript/define-config.ts` - defineConfig helper
- [ ] `examples/05-typescript/README.md` - Documentation

### Task 11.6: Advanced Examples (06-advanced/)
- [ ] `examples/06-advanced/hot-reload.ts` - Watch mode
- [ ] `examples/06-advanced/merge-strategies.ts` - Custom merge
- [ ] `examples/06-advanced/programmatic.ts` - Dynamic config
- [ ] `examples/06-advanced/README.md` - Documentation

### Task 11.7: Real-World Examples (07-real-world/)
- [ ] `examples/07-real-world/express-app/` - Express.js integration
- [ ] `examples/07-real-world/nextjs-app/` - Next.js integration
- [ ] `examples/07-real-world/cli-tool/` - CLI tool config
- [ ] `examples/07-real-world/README.md` - Documentation

### Task 11.8: Verify Examples
- [ ] Run all examples successfully
- [ ] Check output matches expectations
- [ ] Fix any issues

---

## Phase 12: LLM-Native Documentation

### Task 12.1: Create llms.txt
Create `llms.txt` (< 2000 tokens):
- [ ] Package overview
- [ ] Installation instructions
- [ ] Basic usage example
- [ ] API summary (main functions)
- [ ] Config methods
- [ ] Available plugins
- [ ] Common patterns
- [ ] Error reference
- [ ] Links (GitHub, docs)

### Task 12.2: Copy llms.txt to Website
- [ ] Copy to `website/public/llms.txt`

### Task 12.3: Optimize README.md
- [ ] First 500 tokens optimized for LLM
- [ ] Clear package description
- [ ] Install command
- [ ] Basic example
- [ ] Feature list
- [ ] Links to docs

---

## Phase 13: Documentation Website

### Task 13.1: Setup Website Project
- [ ] Create `website/package.json`
- [ ] Create `website/vite.config.ts`
- [ ] Create `website/tsconfig.json`
- [ ] Install dependencies (React, Vite, Tailwind, etc.)

### Task 13.2: Create Website Components
- [ ] `website/src/components/CodeBlock.tsx` - IDE-style with line numbers
- [ ] `website/src/components/CopyButton.tsx` - Copy to clipboard
- [ ] `website/src/components/ThemeToggle.tsx` - Dark/Light mode
- [ ] `website/src/components/Navbar.tsx` - Navigation
- [ ] `website/src/components/Footer.tsx` - Footer with links

### Task 13.3: Create Website Pages
- [ ] `website/src/pages/Home.tsx` - Hero, features, install
- [ ] `website/src/pages/GettingStarted.tsx` - Installation, basics
- [ ] `website/src/pages/Formats.tsx` - Format documentation
- [ ] `website/src/pages/API.tsx` - API reference
- [ ] `website/src/pages/Plugins.tsx` - Plugin documentation
- [ ] `website/src/pages/Examples.tsx` - Examples gallery
- [ ] `website/src/pages/Playground.tsx` - Interactive editor

### Task 13.4: Styling and Theme
- [ ] Configure Tailwind CSS
- [ ] Dark/Light theme system
- [ ] Responsive design
- [ ] Mobile optimization

### Task 13.5: Website Content
- [ ] All documentation content
- [ ] Code examples with syntax highlighting
- [ ] Copy buttons on all code blocks
- [ ] Mobile responsive layout

### Task 13.6: Deploy Configuration
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Create `website/public/CNAME` (config.oxog.dev)
- [ ] Test build process

---

## Phase 14: Final Verification

### Task 14.1: Build Verification
- [ ] Run `npm run build` - Verify successful build
- [ ] Check bundle size < 5KB core, < 15KB all plugins
- [ ] Verify ESM and CJS outputs
- [ ] Verify TypeScript declarations

### Task 14.2: Test Verification
- [ ] Run `npm run test` - All tests pass
- [ ] Run `npm run test:coverage` - 100% coverage
- [ ] Verify no test failures
- [ ] Check coverage reports

### Task 14.3: Lint and Format
- [ ] Run `npm run lint` - ESLint passes
- [ ] Run `npm run format` - Prettier formatting
- [ ] Run `npm run typecheck` - TypeScript no errors

### Task 14.4: Example Verification
- [ ] Run all 15+ examples
- [ ] Verify correct output
- [ ] Fix any issues

### Task 14.5: Website Verification
- [ ] Build website `cd website && npm run build`
- [ ] Verify no build errors
- [ ] Test all pages load correctly
- [ ] Verify theme toggle works
- [ ] Verify copy buttons work
- [ ] Verify mobile responsive

### Task 14.6: Documentation Verification
- [ ] README.md complete and accurate
- [ ] llms.txt < 2000 tokens
- [ ] All JSDoc complete with @example
- [ ] CHANGELOG.md updated

### Task 14.7: Final Integration Test
- [ ] Create test project
- [ ] Install package
- [ ] Load configuration
- [ ] Test all major features
- [ ] Verify no errors

---

## Success Criteria

All tasks must be completed with:
- ✅ 100% test coverage (lines, branches, functions)
- ✅ All tests passing (0 failures)
- ✅ TypeScript compilation with 0 errors
- ✅ ESLint passing
- ✅ Bundle building successfully
- ✅ All 15+ examples working
- ✅ Website building and deploying
- ✅ Documentation complete

---

## Notes

- Follow TypeScript strict mode settings
- Write tests BEFORE or WITH implementation
- Document every public API with JSDoc and @example
- Use meaningful variable and function names
- Keep functions small and focused
- Handle all error cases
- Clean up resources (file watchers, event listeners)
- No runtime dependencies allowed
- Zero-dependency implementation required
