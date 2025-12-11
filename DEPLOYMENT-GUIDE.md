# Deployment Guide for cPanel Node.js App

## Overview
This app is deployed to a cPanel shared hosting environment using Node.js Application Manager (Passenger).

## Prerequisites
- cPanel Node.js App already configured and running
- SSH access with private key (`~/.ssh/id_rsa_tmf_deploy`)
- Server details:
  - Host: `192.64.117.125`
  - Port: `21098`
  - User: `themzeni`
  - Path: `/home/themzeni/ai.themetafuture.online`
  - Node Environment: `/home/themzeni/nodevenv/ai.themetafuture.online/20`

## Deployment Commands

### Full Deployment
```bash
npm run deploy
```
This runs: build → upload → install → migrate → restart

### Individual Steps

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Upload files to server**
   ```bash
   npm run deploy:upload
   ```

3. **Install dependencies on server**
   ```bash
   npm run deploy:install
   ```

4. **Run database migrations**
   ```bash
   npm run deploy:migrate
   ```

5. **Restart the app (cPanel Passenger)**
   ```bash
   npm run deploy:restart
   ```

6. **Upload environment variables**
   ```bash
   npm run deploy:env
   ```

7. **Check app status**
   ```bash
   npm run deploy:status
   ```

## How cPanel Restart Works

cPanel's Passenger (Node.js Application Manager) watches for file changes in `tmp/restart.txt`. When this file is touched (timestamp updated), Passenger automatically restarts the app.

**✓ DO:**
- Use `npm run deploy:restart` to restart the app
- Let cPanel's Passenger manage the Node.js process
- Check logs via cPanel if issues occur

**✗ DON'T:**
- Manually run `node server.js` (conflicts with cPanel)
- Use PM2 or other process managers (cPanel uses Passenger)
- Kill Node processes manually

## Important: CloudLinux node_modules Symlink

**Critical:** CloudLinux's NodeJS Selector requires `node_modules` to be a **symlink** to the virtual environment, not a regular directory.

If you get this error during deployment:
```
Cloudlinux NodeJS Selector demands to store node modules for application in separate folder (virtual environment) pointed by symlink called "node_modules"
```

**Solution:**
1. Remove the `node_modules` directory on the server:
   ```bash
   ssh -i ~/.ssh/id_rsa_tmf_deploy themzeni@192.64.117.125 -p 21098
   cd /home/themzeni/ai.themetafuture.online
   mv node_modules node_modules.backup  # Backup first
   ```

2. Reinstall using cPanel's Node environment:
   ```bash
   source /home/themzeni/nodevenv/ai.themetafuture.online/20/bin/activate
   npm install --omit=dev
   ```

3. Verify it's now a symlink:
   ```bash
   ls -l node_modules
   # Should show: node_modules -> /home/themzeni/nodevenv/...
   ```

4. Clean up backup:
   ```bash
   rm -rf node_modules.backup
   ```

**Prevention:** The `.deployignore` file already excludes `node_modules/`, so it won't be uploaded during deployment.

## Troubleshooting

### 503 Service Unavailable
1. Check if Node.js app is running in cPanel:
   - Go to cPanel → Setup Node.js App
   - Ensure app status is "Running"

2. Verify `.htaccess` proxy configuration:
   - Should proxy to `http://127.0.0.1:3000`

3. Check server logs:
   ```bash
   ssh -i ~/.ssh/id_rsa_tmf_deploy themzeni@192.64.117.125 -p 21098
   cd /home/themzeni/ai.themetafuture.online
   tail -50 ~/logs/ai.themetafuture.online-error_log
   ```

### App Not Restarting
1. Manually restart via cPanel:
   - Go to Setup Node.js App
   - Click "Restart"

2. Or trigger restart via command:
   ```bash
   npm run deploy:restart
   ```

### Database Connection Issues
1. Verify `.env` file exists on server
2. Check database credentials in cPanel
3. Run migrations:
   ```bash
   npm run deploy:migrate
   ```

## Files Excluded from Deployment

See `.deployignore` for the complete list. Key exclusions:
- `node_modules/` (installed on server)
- `.git/`
- Development/test scripts
- Documentation files
- IDE files

## Server Configuration

### cPanel Node.js App Settings
- **Application Root:** `/home/themzeni/ai.themetafuture.online`
- **Application URL:** `https://ai.themetafuture.online`
- **Application Startup File:** `server.js`
- **Node.js Version:** 20.x
- **Environment:** Production

### Required Files on Server
- `server.js` - Entry point for Node.js (cPanel Passenger uses this)
- `.next/` - Built Next.js files
- `.env` - Environment variables
- `package.json` - Dependencies
- `node_modules/` - Installed packages (as symlink to virtual environment)

**Note:** `.htaccess` is **NOT** needed and should **NOT** be deployed. cPanel's Passenger handles all routing internally.

## Notes

- The app uses Passenger (cPanel's Node.js manager), not manual `node` commands
- Database migrations run automatically during deployment
- Static files are served by Next.js, proxied through `.htaccess`
- All deployment is done via SSH with key authentication
