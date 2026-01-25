# Package Installation Guide for Libraries

This document explains how packages should be installed in library projects like `@sklv-labs/ts-nestjs-openapi`.

## Dependency Types

### 1. **peerDependencies** (Required for consumers)

Packages that **must** be installed by the consuming application. These are dependencies that your library uses but expects the consumer to provide.

**When to use:**
- The package is required for your library to work
- Different consumers might need different versions
- You want to avoid version conflicts
- The package is a framework or core dependency (e.g., `@nestjs/common`, `@nestjs/swagger`)

**Example:**
```json
{
  "peerDependencies": {
    "@nestjs/common": "^11.1.11",
    "@nestjs/swagger": "^11.2.4"
  }
}
```

**Why:** When someone installs your library, npm/yarn will warn them if these packages are missing. This ensures compatibility and prevents duplicate installations.

### 2. **dependencies** (Bundled with library)

Packages that are **bundled** with your library and installed automatically when someone installs your package.

**When to use:**
- The package is a utility library that doesn't conflict with consumer dependencies
- You want to ensure a specific version is always available
- The package is not a framework dependency

**Example:**
```json
{
  "dependencies": {
    "lodash": "^4.17.21"
  }
}
```

**Note:** For NestJS libraries, you typically **don't** use `dependencies` for framework packages because they should be provided by the consumer.

### 3. **devDependencies** (Development only)

Packages used only during development, testing, and building. These are **not** installed when someone installs your library.

**When to use:**
- Build tools (TypeScript, ESLint, Prettier)
- Testing frameworks (Jest)
- Development utilities
- Type definitions for testing

**Example:**
```json
{
  "devDependencies": {
    "@types/node": "^25.0.3",
    "typescript": "^5.9.3",
    "jest": "^30.2.0"
  }
}
```

**Important:** Even if a package is in `peerDependencies`, you should also include it in `devDependencies` if you need it for:
- Type checking during development
- Running tests
- Building the library

## Best Practices for NestJS Libraries

### ✅ DO:

1. **Put framework packages in `peerDependencies`:**
   ```json
   {
     "peerDependencies": {
       "@nestjs/common": "^11.1.11",
       "@nestjs/core": "^11.1.11",
       "@nestjs/swagger": "^11.2.4"
     }
   }
   ```

2. **Also include them in `devDependencies` for development:**
   ```json
   {
     "devDependencies": {
       "@nestjs/common": "^11.1.11",
       "@nestjs/swagger": "^11.2.4"
     }
   }
   ```

3. **Use caret (^) ranges for peer dependencies** to allow minor and patch updates

4. **Document required peer dependencies** in your README

### ❌ DON'T:

1. **Don't put framework packages in `dependencies`** - this can cause version conflicts
2. **Don't use exact versions (without ^)** in peerDependencies unless necessary
3. **Don't forget to include optional peer dependencies** if your library supports them

## Example: This Library

For `@sklv-labs/ts-nestjs-openapi`:

```json
{
  "peerDependencies": {
    "@nestjs/common": "^11.1.11",
    "@nestjs/core": "^11.1.11",
    "@nestjs/swagger": "^11.2.4",        // Required for OpenAPI document generation
    "@scalar/nestjs-api-reference": "^1.0.0",  // Required only if using Scalar UI
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2"
  },
  "devDependencies": {
    "@nestjs/common": "^11.1.11",        // For type checking
    "@nestjs/swagger": "^11.2.4",        // For type checking
    "@scalar/nestjs-api-reference": "^1.0.0",  // For type checking
    // ... other dev dependencies
  }
}
```

## Installation Instructions for Consumers

When someone installs your library, they should:

```bash
# Install your library
npm install @sklv-labs/ts-nestjs-openapi

# Install required peer dependencies (if not already installed)
npm install @nestjs/common @nestjs/core @nestjs/swagger

# If using Scalar UI (optional)
npm install @scalar/nestjs-api-reference
```

## Optional Dependencies

For optional features (like Scalar), you can:

1. **Document in README** that it's optional
2. **Use conditional imports** in your code
3. **Provide clear error messages** if the package is missing when the feature is used

## Summary

- **peerDependencies**: Required packages that consumers must install
- **devDependencies**: Packages needed only for development
- **dependencies**: Rarely used in NestJS libraries (only for non-framework utilities)

The key principle: **Let consumers provide framework dependencies, but include them in devDependencies for your own development needs.**
