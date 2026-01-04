# @oxog/config Examples

This directory contains comprehensive examples demonstrating how to use `@oxog/config` in various scenarios.

## Examples Structure

### 01 - Basic Examples

These examples cover the fundamental features of `@oxog/config`:

1. **Simple Configuration Loading** (`01-simple-load.ts`)
   - Load configuration from default locations
   - Access configuration values with defaults

2. **Type-Safe Configuration** (`02-typed-config.ts`)
   - Use TypeScript generics for type safety
   - Prevent type errors at compile time

3. **Programmatic Configuration Creation** (`03-create-config.ts`)
   - Create configuration programmatically
   - Use get, set, has, delete methods
   - Convert to object and JSON

4. **Event Handling** (`04-event-handling.ts`)
   - Listen to configuration change events
   - Watch for file changes

### 02 - Advanced Examples

Advanced features and customization:

5. **Custom Merge Strategies** (`01-merge-strategy.ts`)
   - Configure how values are merged
   - Use different strategies for different paths
   - Handle arrays and objects differently

6. **Environment-Based Overrides** (`02-environment-overrides.ts`)
   - Load environment-specific configurations
   - Support for .env files
   - Local overrides (gitignored)

7. **File Watching and Hot Reload** (`03-file-watching.ts`)
   - Watch configuration files for changes
   - Automatic reload on changes
   - Debounce configuration updates

8. **Required Fields Validation** (`04-required-fields.ts`)
   - Validate required configuration fields
   - Error handling for missing fields

9. **Configuration Encryption** (`05-encryption.ts`)
   - Encrypt sensitive configuration values
   - AES-256-GCM encryption
   - Automatic encryption/decryption

### 03 - Plugin Examples

Using and creating plugins:

10. **Using Plugins** (`01-using-plugins.ts`)
    - Install built-in plugins
    - YAML parser plugin
    - Validation plugin

11. **Creating Custom Plugins** (`02-custom-plugin.ts`)
    - Define custom plugins
    - Plugin lifecycle hooks
    - Event handling in plugins

12. **Configuration Validation** (`03-validation-plugin.ts`)
    - JSON Schema validation
    - Custom validation rules
    - Error handling

### 04 - Configuration Format Examples

Examples for each supported format:

13. **JSON Format** (`01-json-format.ts`)
    - Native JSON support
    - Error handling with line numbers

14. **YAML Format** (`02-yaml-format.ts`)
    - YAML parser plugin
    - Anchors and aliases
    - Multi-line strings

15. **ENV Format** (`03-env-format.ts`)
    - Environment variable support
    - Variable expansion
    - Default values

### 05 - Integration Examples

Real-world integration scenarios:

16. **Express.js Integration** (`01-express-server.ts`)
    - Load configuration for Express server
    - Dynamic configuration access

17. **Database Configuration** (`02-database-config.ts`)
    - Database connection configuration
    - Connection pooling settings

18. **Microservice Configuration** (`03-microservice-config.ts`)
    - Complex microservice setup
    - Multiple configuration sources
    - Service discovery

## Running Examples

Each example can be run independently:

```bash
# Run a specific example
npx ts-node examples/01-basic/01-simple-load.ts

# Run with TypeScript
ts-node examples/02-advanced/01-merge-strategy.ts
```

## Prerequisites

- Node.js 16+ installed
- TypeScript installed globally or use `npx ts-node`
- Configuration files as referenced in each example

## Configuration Files

Some examples reference configuration files (`.json`, `.yaml`, `.env`, etc.). Create these files in the examples directory or update paths in the examples.

Example `config.json`:
```json
{
  "port": 3000,
  "host": "localhost",
  "database": {
    "host": "localhost",
    "port": 5432,
    "username": "admin",
    "password": "secret"
  }
}
```

Example `config.yaml`:
```yaml
port: 3000
host: localhost
database:
  host: localhost
  port: 5432
  username: admin
  password: secret
```

Example `.env`:
```env
PORT=3000
HOST=localhost
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=admin
DATABASE_PASSWORD=secret
```

## Learning Path

For new users, we recommend following this learning path:

1. Start with **Basic Examples** to understand core concepts
2. Move to **Advanced Examples** for customization
3. Explore **Plugin Examples** for extensibility
4. Review **Format Examples** for data formats
5. Study **Integration Examples** for real-world use cases

## More Information

- [API Documentation](../README.md)
- [Project Documentation](../IMPLEMENTATION.md)
- [GitHub Repository](https://github.com/ersinkoc/oxog-config)

## License

MIT License - same as the main project.
