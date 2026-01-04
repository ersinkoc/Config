# Contributing to @oxog/config

Thank you for your interest in contributing to @oxog/config! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submission Process](#submission-process)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git for version control

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/oxog-config.git
   cd oxog-config
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Run in development mode (if applicable)

# Building
npm run build        # Build the package
npm run build:watch  # Build in watch mode

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run format       # Format code
npm run typecheck    # Run TypeScript type checking

# Documentation
npm run docs:build   # Build documentation website
npm run docs:dev     # Start documentation dev server
```

### Development Process

1. **Create a feature branch** from `main`
2. **Make your changes** following our coding standards
3. **Write/update tests** for your changes
4. **Run all tests** and ensure they pass
5. **Update documentation** if needed
6. **Submit a pull request**

## Coding Standards

### TypeScript

- Use **strict mode** TypeScript
- Enable **noImplicitAny**
- Use **generic types** when appropriate
- Provide **type annotations** for public APIs
- Use **interface** for object shapes
- Use **enum** for constants

### Code Style

- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **trailing commas** where valid
- Use **meaningful variable names**
- Keep **functions small** and focused
- Add **JSDoc comments** for public APIs

### Example

```typescript
/**
 * Creates a new configuration instance.
 *
 * @param data - Initial configuration data
 * @returns A new Config instance
 *
 * @example
 * ```typescript
 * const config = createConfig({ port: 3000 });
 * const port = config.get('port');
 * ```
 */
export function createConfig<T extends object = Record<string, unknown>>(
  data: T
): Config<T> {
  return new ConfigImpl(data);
}
```

## Testing Guidelines

### Test Structure

- Place tests in `tests/` directory
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`

### Test Naming

- Use **descriptive test names**
- Group related tests with `describe` blocks
- Follow pattern: `it('should [expected behavior] when [condition]')`

### Example

```typescript
describe('Config', () => {
  describe('get()', () => {
    it('should return value when path exists', () => {
      const config = createConfig({ port: 3000 });
      expect(config.get('port')).toBe(3000);
    });

    it('should return default when path does not exist', () => {
      const config = createConfig({ port: 3000 });
      expect(config.get('missing', 'default')).toBe('default');
    });
  });
});
```

### Coverage Requirements

- Aim for **100% coverage** on new code
- Minimum **80% coverage** overall
- All **critical paths** must be tested
- Include **edge cases** and **error conditions**

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test/file.test.ts
```

## Documentation

### API Documentation

- Use **JSDoc comments** for all public APIs
- Include **examples** in docstrings
- Document **parameters** and **return types**
- Note **edge cases** and **limitations**

### README Updates

- Update **README.md** for user-facing changes
- Update **CHANGELOG.md** for all changes
- Update **examples/** for new features

### Website Documentation

- Update **website/** for major features
- Add **code examples** with syntax highlighting
- Keep **API reference** up to date

## Submission Process

### Pull Request

1. **Update your fork**:
   ```bash
   git remote add upstream https://github.com/ersinkoc/oxog-config.git
   git pull upstream main
   ```

2. **Create a pull request** with:
   - Clear **title** and **description**
   - Link to **related issues**
   - **Screenshots** for UI changes
   - **Test results** from CI

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Updated documentation

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is well-commented
- [ ] Documentation updated
- [ ] No new TypeScript errors
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on multiple Node.js versions
4. **Security audit** for vulnerabilities
5. **Approval** and **merge**

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (x.y.0): New features (backward compatible)
- **PATCH** (x.y.z): Bug fixes (backward compatible)

### Release Steps

1. Update **CHANGELOG.md**
2. Update **package.json** version
3. Create **release PR**
4. After merge, create **GitHub release**
5. **Publish to npm** (automatic via GitHub Actions)

## Additional Resources

- [Project README](./README.md)
- [Implementation Guide](./IMPLEMENTATION.md)
- [API Documentation](./docs/api.md)
- [Examples](./examples/README.md)

## Questions?

- Open an **issue** for bugs or feature requests
- Join our **discussions** for questions
- Check **existing issues** before creating new ones

## Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **CHANGELOG.md** release notes
- **GitHub** contributors page

---

Thank you for contributing! 🎉
