# ZACORPS End-to-End Tests

This directory contains comprehensive Playwright e2e tests for the ZACORPS frontend application.

## Test Structure

```
test/e2e/
├── navigation.spec.ts        # Navigation & routing (8 tests)
├── home-page.spec.ts          # Home page UI/UX (6 tests)
├── theme-toggle.spec.ts       # Dark/light theme toggle (4 tests)
├── admin-login.spec.ts        # Admin authentication (5 tests)
├── employee-login.spec.ts     # Employee authentication (4 tests)
├── about-page.spec.ts         # About page content (5 tests)
└── accessibility.spec.ts      # Web standards & performance (4 tests)
```

**Total: 36 tests**

## Running Tests

### Quick Start
```bash
# Run all tests (headless)
npm run test:e2e

# Expected: All 36 tests pass in ~30-60 seconds
```

### Interactive Mode (Recommended for Development)
```bash
# Launch Playwright UI
npm run test:e2e:ui

# Benefits:
# - See tests run in real-time
# - Debug failures easily
# - Time travel through test steps
# - Watch mode for development
```

### Headed Mode (See Browser)
```bash
# Run tests with visible browser
npm run test:e2e:headed

# Useful for:
# - Debugging visual issues
# - Understanding test flow
# - Presentations/demos
```

### View Reports
```bash
# After running tests, view HTML report
npm run test:e2e:report

# Opens detailed report with:
# - Test results
# - Screenshots (on failure)
# - Videos (on failure)
# - Trace files
```

## Test Scenarios

### 1. Navigation Tests (navigation.spec.ts)
- ✅ Home page loads successfully
- ✅ Navigate to Admin login
- ✅ Navigate to About page
- ✅ HOME link works from all pages
- ✅ Employee login accessible
- ✅ HR page accessible
- ✅ Navigation bar responsive
- ✅ Navigation consistent across pages

### 2. Home Page Tests (home-page.spec.ts)
- ✅ ZACORPS branding visible
- ✅ Professional hero section
- ✅ Feature cards/sections displayed
- ✅ Call-to-action elements present
- ✅ No JavaScript errors
- ✅ Mobile responsive

### 3. Theme Toggle Tests (theme-toggle.spec.ts)
- ✅ Theme toggle button visible
- ✅ Toggles between dark/light mode
- ✅ Theme persists across navigation
- ✅ Theme styling applies correctly

### 4. Admin Login Tests (admin-login.spec.ts)
- ✅ Admin login page loads
- ✅ Login UI elements displayed
- ✅ ZACORPS branding on login page
- ✅ Navigation accessible from login
- ✅ No critical console errors

### 5. Employee Login Tests (employee-login.spec.ts)
- ✅ Employee login page loads
- ✅ Employee-specific branding
- ✅ Wallet connection UI
- ✅ Navigate back to home

### 6. About Page Tests (about-page.spec.ts)
- ✅ About page loads
- ✅ Zama FHE information displayed
- ✅ Structured content sections
- ✅ Accessible via navigation
- ✅ Professional layout

### 7. Accessibility Tests (accessibility.spec.ts)
- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy
- ✅ Loads within 5 seconds
- ✅ Valid internal links

## Test Configuration

Tests are configured in [`playwright.config.ts`](../../playwright.config.ts) to run on:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

Base URL: `http://localhost:3000` (auto-starts dev server)

## CI/CD Integration

### GitHub Actions (Example)
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Install Playwright browsers
        run: |
          cd frontend
          npx playwright install --with-deps
      - name: Run e2e tests
        run: |
          cd frontend
          npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Debugging Tests

### 1. Use Playwright UI Mode
```bash
npm run test:e2e:ui
```

### 2. Run Specific Test File
```bash
npx playwright test navigation.spec.ts
```

### 3. Run Specific Test
```bash
npx playwright test -g "should load home page"
```

### 4. Debug Mode
```bash
npx playwright test --debug
```

### 5. Show Trace
```bash
# After a failed test run
npx playwright show-trace test-results/.../trace.zip
```

## Test Best Practices

1. **Tests are isolated**: Each test runs independently
2. **No wallet required**: Tests focus on UI/UX, not Web3 functionality
3. **Fast execution**: ~30-60 seconds for full suite
4. **Cross-browser**: Tests run on Chrome, Firefox, Safari
5. **Resilient selectors**: Tests use text content, not brittle CSS selectors

## Updating Tests

When adding new pages/features:

1. Create new `*.spec.ts` file in `test/e2e/`
2. Follow existing test structure
3. Use descriptive test names
4. Add assertions for key functionality
5. Update this README

## Troubleshooting

### Tests Fail on First Run
```bash
# Make sure dev server starts successfully
npm run dev

# Access http://localhost:3000 manually to verify
```

### Browser Download Failed
```bash
# Reinstall browsers
npx playwright install --with-deps
```

### Page Doesn't Load
```bash
# Check if Next.js dev server is running
# Playwright auto-starts it, but check logs for errors
```

### Slow Test Execution
```bash
# Run on single browser (faster)
npx playwright test --project=chromium
```

## Contributing

When adding tests:
- ✅ Test user-facing functionality
- ✅ Use accessible selectors (text, roles)
- ✅ Keep tests independent
- ✅ Add meaningful assertions
- ✅ Update documentation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI Integration](https://playwright.dev/docs/ci)
