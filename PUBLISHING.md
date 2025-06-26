# Publishing Frami to NPM

This guide covers how to publish Frami to NPM using GitHub Actions automation.

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **NPM Token**: Generate an access token in your NPM account settings
3. **GitHub Repository**: Push your code to GitHub

## Initial Setup

### 1. Set up NPM Token in GitHub Secrets

1. Go to your NPM account → Access Tokens → Generate New Token
2. Select "Automation" type (for CI/CD)
3. Copy the token
4. In your GitHub repository:
   - Go to Settings → Secrets and Variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM token

### 2. Verify Package Configuration

Check that your `package.json` has:

```json
{
  "name": "frami",
  "version": "1.0.0",
  "description": "AI-powered video thumbnail recommendation library",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*",
    "README.md",
    "LICENSE"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/andrewngabriel/frami.git"
  }
}
```

## Publishing Methods

### Method 1: Automated Release (Recommended)

1. **Create a new release** in GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Or use GitHub UI**:
   - Go to Releases → Create a new release
   - Tag: `v1.0.0`
   - Title: `Release v1.0.0`
   - Description: Release notes
   - Click "Publish release"

3. **GitHub Actions will automatically**:
   - Run tests
   - Build the project
   - Publish to NPM

### Method 2: Manual Version Bump

1. **Use the GitHub Actions workflow**:
   - Go to Actions → Version Bump
   - Click "Run workflow"
   - Select version type (patch/minor/major)
   - This will automatically bump version and create a release

### Method 3: Manual Publishing

```bash
# Build the project
npm run build

# Run tests
npm test

# Login to NPM (one-time setup)
npm login

# Publish
npm publish
```

## Version Management

### Semantic Versioning

- **Patch** (1.0.0 → 1.0.1): Bug fixes, small improvements
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

### Automated Version Bumping

```bash
# Bump patch version
npm version patch

# Bump minor version  
npm version minor

# Bump major version
npm version major
```

## GitHub Actions Workflows

### 1. CI/CD (`ci.yml`)
**Triggers**: Push to main/develop, Pull requests  
**Permissions**: Anyone (for open source contributions)
**Actions**:
- Tests on Node 18.x and 20.x
- Linting and coverage
- Build verification

### 2. NPM Publishing (`publish.yml`)
**Triggers**: GitHub release created  
**Permissions**: ⚠️ **Restricted to project maintainer only**
**Actions**:
- Run tests
- Build project
- Publish to NPM

### 3. Version Bump (`version-bump.yml`)
**Triggers**: Manual workflow dispatch  
**Permissions**: ⚠️ **Restricted to project maintainer only**
**Actions**:
- Bump version
- Create git tag
- Create GitHub release
- Trigger NPM publish

### 4. Deploy (`deploy.yml`)
**Triggers**: Manual workflow dispatch  
**Permissions**: ⚠️ **Restricted to project maintainer only**
**Actions**:
- Deploy to staging/production environments
- Update documentation sites

## Pre-Publish Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] README.md updated
- [ ] Version bumped appropriately
- [ ] CHANGELOG.md updated (if applicable)
- [ ] NPM token configured in GitHub secrets

## Post-Publish Verification

1. **Check NPM**: Visit `https://www.npmjs.com/package/frami`
2. **Test installation**:
   ```bash
   npm install frami
   node -e "console.log(require('frami'))"
   ```
3. **Verify GitHub release**: Check that release was created with assets

## Troubleshooting

### Common Issues

**"Package already exists"**
- Version number already published
- Bump version and try again

**"Unauthorized"**
- Check NPM token is correct
- Verify token has publish permissions

**"Tests failing in CI"**
- Run `npm test` locally first
- Check Node.js version compatibility

**"Build artifacts missing"**
- Ensure `npm run build` works locally
- Check `dist/` directory is created

### Publishing Failures

If publishing fails:

1. Check GitHub Actions logs
2. Verify all secrets are configured
3. Ensure package name is available on NPM
4. Check npm status: [status.npmjs.org](https://status.npmjs.org)

## Best Practices

1. **Always test before publishing**
2. **Use semantic versioning**
3. **Write descriptive release notes**
4. **Keep dependencies up to date**
5. **Monitor package downloads and issues**

## Security Considerations

- Never commit NPM tokens to git
- Use GitHub secrets for sensitive data
- Regularly rotate access tokens
- Review package contents before publishing (`npm pack` to preview)
- **Workflow restrictions**: Publishing workflows are restricted to project maintainer
- **CODEOWNERS**: Critical files require maintainer approval
- **Branch protection**: Enable branch protection rules on main branch

## Future Enhancements

Consider adding:
- Automated dependency updates (Dependabot)
- Security scanning (CodeQL)
- Performance benchmarks
- Integration tests with actual videos
- Documentation generation