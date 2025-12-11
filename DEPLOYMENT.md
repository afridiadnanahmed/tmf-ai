# Deployment Guide - Namecheap with LiteSpeed

This guide covers deploying your Next.js application to Namecheap hosting with LiteSpeed.

## Prerequisites

1. Namecheap shared hosting plan with Node.js support
2. Production database (Neon, Supabase, Railway, or similar)
3. SSH/FTP access to your Namecheap hosting

## Step 1: Configure Production Environment

1. Open `.env.production` and update all values:
   - `DATABASE_URL`: Your production PostgreSQL database URL
   - `NEXTAUTH_URL`: Your production domain (e.g., `https://yourdomain.com`)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `OAUTH_STATE_SECRET`: Generate with `openssl rand -base64 32`
   - `ENCRYPTION_KEY`: Generate with `openssl rand -hex 32`
   - `NEXT_PUBLIC_APP_URL`: Your production domain

**IMPORTANT**: Never commit `.env.production` to git. It's already in `.gitignore`.

## Step 2: Build for Production

Run the production build locally:

```bash
# Install dependencies
npm install

# Run database migrations (if needed)
npm run db:push

# Build the application
npm run build
```

This creates an optimized production build in the `.next` folder.

## Step 3: Prepare for Deployment

Next.js on shared hosting requires a standalone build. Update `next.config.mjs`:

```javascript
const nextConfig = {
  output: 'standalone', // Add this line
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
```

Then rebuild:
```bash
npm run build
```

## Step 4: Files to Upload

Upload these files/folders to your Namecheap hosting (usually to `public_html` or `tmfai` directory):

```
.next/              (entire folder from standalone build)
node_modules/       (or run npm install on server)
public/             (static assets)
package.json
package-lock.json
.env.production     (rename to .env on server)
```

## Step 5: Server Setup

### Option A: Using Node.js Application Manager (Recommended)

If Namecheap provides a Node.js application manager in cPanel:

1. Go to cPanel → Setup Node.js App
2. Create new application:
   - Node.js version: 18.x or 20.x
   - Application mode: Production
   - Application root: `/home/username/tmfai` (or your folder)
   - Application URL: Your domain
   - Application startup file: `server.js` (create this file - see below)

3. Create `server.js` in your root directory:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

4. Install dependencies on server:
```bash
npm install --production
```

5. Start the application through cPanel Node.js manager

### Option B: Using PM2 (Advanced)

If you have SSH access:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "tmfai" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on reboot
pm2 startup
```

## Step 6: Configure LiteSpeed

### .htaccess Configuration

Create or update `.htaccess` in your public_html:

```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy to Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

Note: Port 3000 should match the port your Node.js app is running on.

## Step 7: Database Migration

Run database migrations on production:

```bash
# SSH into your server
ssh username@yourdomain.com

# Navigate to your app directory
cd tmfai

# Run migrations
npm run db:push
```

## Step 8: Verify Deployment

1. Visit your domain
2. Check that the application loads
3. Test authentication flow
4. Test OAuth integrations
5. Check logs for any errors

## Troubleshooting

### Application Won't Start

- Check Node.js version (requires 18.x or higher)
- Verify all environment variables in `.env`
- Check server logs: `tail -f ~/logs/tmfai.log`

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Ensure production database allows connections from your server IP
- Check SSL mode requirements (`?sslmode=require`)

### OAuth Issues

- Update OAuth app redirect URLs to production domain
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check that `OAUTH_STATE_SECRET` and `ENCRYPTION_KEY` are set

### Static Assets Not Loading

- Ensure `public/` folder is uploaded
- Check `.htaccess` configuration
- Verify file permissions (644 for files, 755 for directories)

## Environment Variables Quick Reference

```bash
# Generate secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET and OAUTH_STATE_SECRET
openssl rand -hex 32     # For ENCRYPTION_KEY
```

## Security Checklist

- [ ] All environment variables set correctly
- [ ] `.env.production` not committed to git
- [ ] HTTPS enforced
- [ ] Database uses SSL connection
- [ ] OAuth secrets properly encrypted
- [ ] File permissions set correctly (not 777)
- [ ] Node_modules installed with `--production` flag

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Rebuild
npm run build

# Restart application
pm2 restart tmfai
# OR restart through cPanel Node.js manager
```

### View Logs

```bash
# PM2 logs
pm2 logs tmfai

# Or check application logs
tail -f ~/logs/tmfai.log
```

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Namecheap Node.js Hosting Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/10085/2182/how-to-install-node-js-on-shared-hosting/)
- [LiteSpeed Documentation](https://docs.litespeedtech.com/)

## Support

For issues specific to:
- Namecheap hosting: Contact Namecheap support
- Application issues: Check application logs and GitHub issues
- Database issues: Check your database provider's documentation
