# Pre-Deployment Checklist

Complete this checklist before deploying the ClubElo refactored server to production on Vercel.

## Code Quality

- [ ] **TypeScript Compilation**
  ```bash
  npm run build
  ```
  Expected: No TypeScript errors

- [ ] **Linting & Code Style**
  ```bash
  # Check for any linting issues (if ESLint configured)
  npm run lint
  ```
  Expected: No warnings or errors

- [ ] **Git Status Clean**
  ```bash
  git status
  ```
  Expected: Working directory clean, no uncommitted changes

- [ ] **Latest Version Pulled**
  ```bash
  git pull origin main
  ```
  Expected: Up to date with remote

## Testing

- [ ] **Unit Tests Pass**
  ```bash
  npm test
  ```
  Expected: All tests pass, coverage > 80%

- [ ] **E2E Tests Pass Locally**
  ```bash
  npm run test:e2e
  ```
  Expected: All 15+ tests passing across all browsers

- [ ] **E2E Tests Pass with Debug Info**
  ```bash
  npm run test:e2e -- --reporter=html
  npm run test:e2e:report
  ```
  Expected: Review HTML report, verify critical paths work

- [ ] **No Console Errors**
  ```bash
  npm run test:e2e:debug
  # Open inspector, check console tab
  ```
  Expected: No red errors in browser console

## Database

- [ ] **Migrations Created (if applicable)**
  ```bash
  # Check if any schema changes were made
  git diff HEAD~1 -- prisma/schema.prisma
  ```
  - [ ] If schema changed: Create migration
    ```bash
    npx prisma migrate dev --name <migration-name>
    ```
  - [ ] Add migration file to git
    ```bash
    git add prisma/migrations/
    git commit -m "Add migration: <description>"
    ```

- [ ] **Database Backed Up**
  - [ ] Production database has recent backup
  - [ ] Backup is verified and restorable
  - [ ] Backup location documented

- [ ] **Test Migration Locally**
  ```bash
  # Use test database
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clubelo_test \
  npx prisma migrate deploy
  ```
  Expected: No errors, schema applied correctly

## Environment Configuration

- [ ] **`.env.example` Updated**
  ```bash
  git diff HEAD -- .env.example
  ```
  Expected: All new variables documented

- [ ] **Vercel Environment Variables Set**
  - [ ] Go to Vercel Dashboard → Project Settings → Environment Variables
  - [ ] Set `DATABASE_URL` (Vercel Postgres or external)
  - [ ] Set `CRON_SECRET` (strong, random value)
  - [ ] Set `NODE_ENV=production`
  - [ ] Set `CLUBELO_API_BASE` (if different from default)
  - [ ] Set `LOG_LEVEL=info`

- [ ] **Sensitive Data Not in Repository**
  ```bash
  git log --all --full-history -- .env | head -1
  ```
  Expected: No `.env` file in git history

- [ ] **.gitignore Includes Sensitive Files**
  ```bash
  grep -E "\.env|\.env\.local|\.env\.production" .gitignore
  ```
  Expected: All environment files listed

## Deployment Configuration

- [ ] **vercel.json Correct**
  ```bash
  cat vercel.json
  ```
  Expected: Build and start commands point to refactored server

- [ ] **package.json Scripts Correct**
  ```bash
  npm run build   # Should compile TypeScript
  npm run start   # Should start refactored server
  ```
  Expected: Both commands succeed

- [ ] **Build Process Tested**
  ```bash
  rm -rf dist node_modules
  npm ci
  npm run build
  ```
  Expected: Clean build succeeds in < 2 minutes

## Documentation

- [ ] **README.md Updated**
  - [ ] Deployment instructions current
  - [ ] Environment variables documented
  - [ ] Quick start guide works

- [ ] **VERCEL_DEPLOYMENT.md Reviewed**
  - [ ] Vercel setup section completed
  - [ ] Environment variables section complete
  - [ ] Database setup verified

- [ ] **DEPLOYMENT_CHECKLIST.md This File**
  - [ ] All items reviewed
  - [ ] All applicable items completed

## GitHub & CI/CD

- [ ] **GitHub Actions Workflow Active**
  - [ ] `.github/workflows/e2e-tests.yml` exists
  - [ ] Workflow shows successful runs on recent commits
  - [ ] PR checks enabled (Settings → Branch protection)

- [ ] **GitHub Branch Protection Rules**
  - [ ] Require status checks to pass before merging
  - [ ] Require E2E tests to pass
  - [ ] Dismiss stale PR approvals
  - [ ] Require latest commit before merge

- [ ] **Latest Commit Tested on CI**
  ```bash
  # Check GitHub Actions status
  # Go to GitHub repo → Actions → Latest workflow run
  ```
  Expected: All checks passing (green)

## Vercel Deployment

- [ ] **Vercel Project Connected**
  - [ ] GitHub repo connected to Vercel
  - [ ] Auto-deployments enabled
  - [ ] Preview deployments enabled

- [ ] **Preview Deployment Tested**
  - [ ] Create feature branch and push to trigger preview
  - [ ] Wait for Vercel preview deployment
  - [ ] Run E2E tests against preview URL:
    ```bash
    PLAYWRIGHT_TEST_BASE_URL=https://your-preview-url.vercel.app npm run test:e2e
    ```
  - [ ] All tests pass
  - [ ] Response times acceptable (< 5s for API calls)

- [ ] **Production Deployment Ready**
  - [ ] All PR checks passing
  - [ ] All code reviews approved
  - [ ] Ready for merge to `main`

## Pre-Merge Review

- [ ] **Code Review Completed**
  - [ ] At least 1 approval from team member
  - [ ] All requested changes addressed
  - [ ] No "Changes requested" status

- [ ] **Commit Messages Clear**
  ```bash
  git log --oneline origin/main..HEAD
  ```
  Expected: Clear, descriptive commit messages

- [ ] **No Large Files Added**
  ```bash
  git ls-files | xargs ls -lS | head -20
  ```
  Expected: No files > 50MB

## Final Checks (Before Merge)

- [ ] **Create Release Notes**
  ```markdown
  ## v1.x.0 Release Notes
  
  ### Features
  - Feature 1
  - Feature 2
  
  ### Bug Fixes
  - Bug fix 1
  
  ### Breaking Changes
  - None (if applicable)
  
  ### Migration Guide
  - Any special deployment steps
  ```

- [ ] **Tag Release**
  ```bash
  git tag -a v1.x.0 -m "Release v1.x.0: <description>"
  git push origin v1.x.0
  ```

- [ ] **Notify Team**
  - [ ] Post in Slack/Teams about deployment
  - [ ] Include release notes link
  - [ ] Mention monitoring instructions

## Post-Deployment (After Merge to Main)

- [ ] **Monitor Vercel Deployment**
  - [ ] Vercel dashboard shows successful deployment
  - [ ] Build logs show no warnings
  - [ ] Function logs show no errors
  - [ ] Response times normal

- [ ] **Monitor E2E Tests on Main**
  - [ ] GitHub Actions workflow completed
  - [ ] All tests passing
  - [ ] No flaky test failures

- [ ] **Test Production Endpoints**
  ```bash
  # Health check
  curl https://your-app.vercel.app/health
  
  # API endpoint
  curl https://your-app.vercel.app/api/rankings?limit=1
  
  # Cron endpoint (if authorized)
  curl -X POST \
    -H "Authorization: Bearer <CRON_SECRET>" \
    https://your-app.vercel.app/cron/import-daily
  ```
  Expected: Successful responses, proper data returned

- [ ] **Monitor Application Logs**
  - [ ] Vercel logs show normal operation
  - [ ] No error spikes
  - [ ] Database connection healthy

- [ ] **Performance Check**
  - [ ] Page loads < 3 seconds
  - [ ] API responses < 1 second
  - [ ] No 500 errors in logs

- [ ] **Database Health**
  - [ ] Check for slow queries
  - [ ] Verify data consistency
  - [ ] Confirm backups running

- [ ] **Alert Team**
  - [ ] Send deployment confirmation message
  - [ ] Include metrics (tests passed, response times)
  - [ ] Note any monitoring alerts to watch

## Rollback Plan

If issues discovered post-deployment:

1. **Immediate Rollback** (if critical)
   ```bash
   # Vercel: Click "Rollback" button in Deployments page
   # Or revert main branch:
   git revert <commit-hash>
   git push origin main
   ```

2. **Database Rollback** (if migration issues)
   ```bash
   # Using backup
   # 1. Stop application
   # 2. Restore database from backup
   # 3. Verify data integrity
   # 4. Restart application
   ```

3. **Monitor After Rollback**
   - [ ] Application stable
   - [ ] No data corruption
   - [ ] Users can access service

## Sign-Off

- [ ] **Deployment Engineer**: _________________ Date: _______
- [ ] **Code Reviewer**: _________________ Date: _______
- [ ] **DevOps/Infrastructure**: _________________ Date: _______

---

## Deployment Summary

- **Deployment Date**: _______________
- **Git Commit**: _______________
- **Vercel Deployment URL**: _______________
- **Issues Encountered**: _______________
- **Rollback Needed**: Yes / No
- **Notes**: _______________

---

## Quick Reference

### Essential Commands

```bash
# Build and test locally
npm run build && npm test && npm run test:e2e

# Deploy to Vercel (automatic on main push)
git push origin main

# Test against Vercel preview
PLAYWRIGHT_TEST_BASE_URL=https://preview-url.vercel.app npm run test:e2e

# View Vercel logs
# Go to: https://vercel.com/dashboard/project-name/logs

# View GitHub Actions logs
# Go to: https://github.com/repo/actions

# View test report
npm run test:e2e:report
```

### Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/your-repo/actions)
- [Database Admin](https://vercel.com/dashboard/storage)
- [Application Logs](https://vercel.com/dashboard/project-name/monitoring)
