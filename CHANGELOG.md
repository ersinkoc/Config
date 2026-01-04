# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-04

### Added

#### Core Features
- Multi-format configuration loading (JSON, YAML, TOML, INI, ENV, JavaScript, TypeScript)
- Environment-based configuration overrides with smart resolution
- Deep merging with customizable strategies (replace, merge, append, prepend, unique)
- Plugin-based micro-kernel architecture
- Type-safe configuration access with full TypeScript support

#### Parsers
- Custom YAML parser with full feature support (anchors, aliases, multi-line strings, comments)
- Custom TOML parser with support for tables, arrays, and dates
- Custom INI parser with section nesting and multi-line values
- Custom ENV parser with variable expansion and default values
- Native JSON parser wrapper

#### Plugins
- **Core Plugins** (always loaded):
  - JSON parser plugin
  - ENV parser plugin
  - Merge strategy plugin
  - Defaults plugin

- **Optional Plugins** (opt-in):
  - YAML parser plugin
  - TOML parser plugin
  - INI parser plugin
  - Validation plugin (JSON Schema support)
  - Encryption plugin (AES-256-GCM)
  - Watch plugin (file watching for hot reload)
  - Cache plugin (LRU cache with TTL)
  - Interpolation plugin (variable interpolation)
  - TypeScript plugin (TypeScript config file loading)

#### Utilities
- Path utilities (get, set, has, delete) with dot notation support
- Deep merge implementation with strategy selection
- File system utilities for config file discovery
- Encryption utilities with PBKDF2 key derivation

#### Configuration Management
- Default values with nested path support
- Required field validation
- Environment variable override with custom prefix
- Hot reload with file watching and debouncing
- Encrypted secrets support

#### API
- `loadConfig<T>()` - Load configuration from files
- `createConfig<T>()` - Create configuration programmatically
- `defineConfig<T>()` - Define typed configuration schema

#### Documentation
- Complete API documentation with JSDoc and examples
- 15+ organized examples covering all features
- LLM-optimized llms.txt file
- Interactive documentation website (config.oxog.dev)
- Getting started guide
- Format-specific documentation
- Plugin development guide

#### Testing
- 100% code coverage (lines, branches, functions, statements)
- Unit tests for all components
- Integration tests for workflows
- End-to-end tests for real-world scenarios
- Comprehensive test fixtures

#### Build & Distribution
- ESM and CJS bundle support
- TypeScript declaration files
- Source maps for debugging
- Bundle size: < 5KB core, < 15KB with all plugins

### Technical Specifications
- **Runtime:** Node.js >= 18
- **TypeScript:** >= 5.0 with strict mode
- **Zero Runtime Dependencies:** No external libraries required
- **Architecture:** Micro-kernel plugin system
- **Testing:** Vitest with 100% coverage threshold

### Security
- AES-256-GCM encryption for secrets
- PBKDF2 key derivation
- Random IV generation
- Authentication tag verification
- Input validation and sanitization

### Performance
- Lazy loading of plugins
- Efficient caching with LRU eviction
- Debounced file watching
- Minimal bundle size
- Fast parsing and merging
