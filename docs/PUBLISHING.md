# Publishing Guide

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **Organization setup**: Since this is a scoped package (`@sklv-labs/ts-nestjs-openapi`), you need to:
   - Create the `sklv-labs` organization on npm (or ensure you have access)
   - Scoped packages are **private by default** unless you publish with `--access public`

## Pre-Publishing Checklist

- [ ] All tests pass (if you have any)
- [ ] Type checking passes: `npm run type-check`
- [ ] README is complete and accurate
- [ ] Version number is correct in `package.json`
- [ ] All files in `files` array exist and are correct
- [ ] LICENSE file is present
- [ ] Repository URL is correct

## Publishing Steps

### 1. Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

### 2. Verify you're logged in

```bash
npm whoami
```

### 3. Check what will be published

```bash
npm pack --dry-run
```

This shows what files will be included in the package.

### 4. Publish the package

Since this is a scoped package, publish it as **public**:

```bash
npm publish --access public
```

Or if you want to publish as private (requires npm paid plan):

```bash
npm publish
```

### 5. Verify publication

Check your package on npm:
```
https://www.npmjs.com/package/@sklv-labs/ts-nestjs-openapi
```

## Version Management

### Update version before publishing

Use npm version commands:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major
```

This automatically:
- Updates `package.json` version
- Creates a git tag
- Commits the change

Then publish:
```bash
npm publish --access public
```

## Troubleshooting

### "You do not have permission to publish"

- Ensure you're logged in: `npm whoami`
- Verify you have access to the `@sklv-labs` organization
- Check if the package name already exists

### "Package name already exists"

- The package name might be taken
- Consider a different name or contact the current owner

### "Invalid package name"

- Scoped packages must start with `@`
- Organization name must match your npm username or organization

## Automated Publishing (Recommended)

This repository includes GitHub Actions workflows for automated publishing using **npm Trusted Publishers** (OIDC authentication).

### Setup Trusted Publishers

1. **Configure on npm:**
   - Go to your package page on npm: https://www.npmjs.com/package/@sklv-labs/ts-nestjs-openapi
   - Click on "Package settings" → "Publishing access"
   - Click "Add trusted publisher"
   - Select "GitHub Actions"
   - Enter your repository: `sklv-labs/ts-nestjs-openapi`
   - Enter the workflow file: `.github/workflows/publish.yml`
   - Click "Add trusted publisher"

2. **No secrets needed!** 
   - Trusted Publishers use OIDC (OpenID Connect) authentication
   - No npm tokens to manage or rotate
   - More secure than traditional token-based authentication

### Automated Release Flow

1. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push
   ```

2. **Bump version and create tag** (this triggers the publish workflow):
   ```bash
   # Patch version (0.1.0 -> 0.1.1)
   npm run version:patch

   # Minor version (0.1.0 -> 0.2.0)
   npm run version:minor

   # Major version (0.1.0 -> 1.0.0)
   npm run version:major
   ```

   These commands will:
   - Update `package.json` version
   - Create a git commit
   - Create a git tag (e.g., `v0.1.1`)
   - Push everything to GitHub

3. **GitHub Actions automatically:**
   - Detects the new tag
   - Runs type checking
   - Publishes to npm
   - Creates a GitHub release

### Manual Publishing (Fallback)

If automation fails, you can still publish manually:

```bash
npm publish --access public
```

## Best Practices

1. **Always test locally first**: Use `npm pack` to create a tarball and test it
2. **Use semantic versioning**: Follow semver (major.minor.patch)
3. **Update CHANGELOG.md**: Document changes before publishing
4. **Tag releases in git**: `npm version` automatically creates tags
5. **Use automated publishing**: Let GitHub Actions handle the release

## Testing the Published Package

After publishing, test it in a new project:

```bash
mkdir test-package
cd test-package
npm init -y
npm install @sklv-labs/ts-nestjs-openapi
```

Then try importing:
```typescript
import { OpenApiModule } from '@sklv-labs/ts-nestjs-openapi';
```
