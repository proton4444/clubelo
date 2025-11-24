# Testing Your Vercel Deployment with Playwright

## Quick Setup

### Option 1: Test Against Your Live Vercel Deployment

```bash
# Replace with your actual Vercel URL
PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

### Option 2: Interactive UI Mode (Recommended for Verification)

```bash
# Replace with your actual Vercel URL
PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e:ui
```

This opens the Playwright Inspector where you can:
- See all tests
- Run tests one by one
- Watch them execute in real-time
- See live browser automation
- Debug any failures

### Option 3: Debug Mode

```bash
PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e:debug
```

Opens step-by-step debugging with full control.

---

## How to Get Your Vercel URL

### If You Haven't Deployed Yet

1. Go to https://vercel.com/dashboard
2. Create a new project from your GitHub repository
3. Deploy (automatic when connected to GitHub)
4. Get your URL from the deployment page

### If Already Deployed

1. Go to https://vercel.com/dashboard
2. Select your project
3. Your URL is shown at the top (like `https://clubelo-xxx.vercel.app`)

---

## Steps to Test Vercel Deployment

### Step 1: Ensure Your App is Deployed to Vercel

```bash
# Push to GitHub (triggers auto-deployment)
git push origin main
```

Wait for Vercel to finish deploying (~2-3 minutes).

### Step 2: Get Your Vercel URL

From Vercel Dashboard, copy your production URL.

### Step 3: Run Playwright Tests

```bash
# Using UI mode (recommended for visual verification)
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-url.vercel.app npm run test:e2e:ui

# Or just run tests
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-url.vercel.app npm run test:e2e

# Or debug mode
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-url.vercel.app npm run test:e2e:debug
```

### Step 4: View Results

```bash
npm run test:e2e:report
```

Opens an interactive HTML report showing:
- All test results
- Screenshots of failures
- Video recordings
- Detailed error messages
- Test timeline

---

## Example Commands

### For Local Development (Localhost)
```bash
npm run test:e2e          # Uses default http://localhost:3001
```

### For Vercel Preview (Feature Branch)
```bash
PLAYWRIGHT_TEST_BASE_URL=https://clubelo-git-feature-xyz.vercel.app npm run test:e2e
```

### For Vercel Production
```bash
PLAYWRIGHT_TEST_BASE_URL=https://clubelo.vercel.app npm run test:e2e
```

### Interactive Testing Against Vercel
```bash
PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app npm run test:e2e:ui
```

---

## What Gets Tested

When you run the Playwright tests, they verify:

### API Tests
✅ Health check endpoint (`/health`)
✅ Rankings API (`/api/elo/rankings`)
✅ Clubs API (`/api/clubs`)
✅ Fixtures API (`/api/fixtures`)
✅ Error handling (404, 400, validation)
✅ Pagination and filtering
✅ Response structure validation

### UI Tests
✅ Home page loads
✅ Navigation works
✅ API docs page loads
✅ No console errors
✅ Page load performance
✅ Responsive design
✅ Mobile compatibility

---

## Troubleshooting

### Issue: "Connection refused" or timeout

**Cause**: The Vercel URL is not responding

**Solution**:
1. Verify the URL is correct
2. Check Vercel dashboard - deployment successful?
3. Try accessing the URL in browser manually
4. Wait for deployment to complete (usually 2-3 minutes)

### Issue: Tests pass locally but fail on Vercel

**Cause**: Different environment or database state

**Solutions**:
```bash
# Test against Vercel and see detailed output
PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app npm run test:e2e --reporter=verbose

# Debug with inspector
PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app npm run test:e2e:debug

# View detailed report
npm run test:e2e:report
```

### Issue: "PLAYWRIGHT_TEST_BASE_URL not found"

**Solution**: Make sure to include it before the command:

```bash
# ✅ Correct
PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app npm run test:e2e

# ❌ Wrong
npm run test:e2e PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app
```

---

## Interactive UI Mode (Best for Verification)

This is the **best way** to visually verify your Vercel deployment:

```bash
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-url.vercel.app npm run test:e2e:ui
```

**What you'll see:**
1. Playwright Inspector opens
2. Left panel shows all tests
3. Center panel shows test code
4. Right panel shows live browser
5. Click any test to run it
6. Watch the browser execute the test in real-time
7. See results, screenshots, and errors

---

## Full Test Verification Workflow

```bash
# 1. Start with the dev server locally to verify setup
npm run dev

# 2. In another terminal, run tests locally
npm run test:e2e

# 3. View local results
npm run test:e2e:report

# 4. Deploy to Vercel
git push origin main

# 5. Wait for deployment (~2-3 minutes)

# 6. Get your Vercel URL from https://vercel.com/dashboard

# 7. Test against Vercel (interactive mode)
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-url.vercel.app npm run test:e2e:ui

# 8. View Vercel test results
npm run test:e2e:report

# 9. All green? Deployment verified!
```

---

## Environment Variables

To make this easier, you can set it in your `.env` file:

```bash
# .env
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-url.vercel.app
```

Then just run:
```bash
npm run test:e2e
```

Or add it to `.env.local` (not committed to git):
```bash
# .env.local
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-url.vercel.app
```

---

## GitHub Actions Automatic Testing

Once deployed, GitHub Actions automatically:
1. Tests every PR against your Vercel instance
2. Posts results in PR comments
3. Prevents merge if tests fail
4. Saves screenshots/videos as artifacts

No manual action needed - it's automatic!

---

## Summary

| Task | Command |
|------|---------|
| Test locally | `npm run test:e2e` |
| Test Vercel (UI) | `PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app npm run test:e2e:ui` |
| Test Vercel (CLI) | `PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app npm run test:e2e` |
| Debug tests | `npm run test:e2e:debug` |
| View results | `npm run test:e2e:report` |

---

## Next Steps

1. **Deploy to Vercel**: `git push origin main`
2. **Wait for deployment**: Check https://vercel.com/dashboard
3. **Copy your URL**: Get it from deployment page
4. **Run Playwright**: `PLAYWRIGHT_TEST_BASE_URL=https://your-url.vercel.app npm run test:e2e:ui`
5. **View results**: `npm run test:e2e:report`

---

**Ready to verify your Vercel deployment? Use the commands above!**
