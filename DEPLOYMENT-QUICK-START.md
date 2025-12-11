# Quick Start - Deployment Guide

## One-Time Setup (WSL Ubuntu)

### Option A: Quick Setup (For Current Session Only)

Run this before deploying (need to do this each time you open a new terminal):

```bash
./setup-ssh.sh
# Enter passphrase when prompted: tmfaiproduct
```

### Option B: Persistent Setup (Recommended - One Time Only)

This makes ssh-agent start automatically in all future terminal sessions:

```bash
# 1. Run the persistent setup script
./setup-ssh-persistent.sh

# 2. Reload your shell configuration
source ~/.bashrc  # or source ~/.zshrc if using zsh

# 3. Add your SSH key (you'll need to do this once per terminal session)
ssh-add ~/.ssh/id_rsa_tmf
# Enter passphrase: tmfaiproduct

# 4. Verify the key is added
ssh-add -l
```

## Deployment Commands

Once SSH is set up, use these commands:

### First Deployment
```bash
# 1. Upload environment file
npm run deploy:env

# 2. Deploy everything
npm run deploy
```

### Regular Updates
```bash
npm run deploy
```

### Individual Steps
```bash
# Upload files only
npm run deploy:upload

# Install dependencies on server
npm run deploy:install

# Restart the app
npm run deploy:restart

# View server logs
npm run deploy:logs
```

## Troubleshooting

### "Permission denied (publickey)"
- Make sure SSH key is added: `ssh-add -l`
- If not listed, run: `ssh-add ~/.ssh/id_rsa_tmf`

### "Could not open a connection to your authentication agent"
- Run: `./setup-ssh.sh`
- Or: `eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_rsa_tmf`

### Test SSH Connection
```bash
ssh -i ~/.ssh/id_rsa_tmf themzeni@192.64.117.125 -p 21098
```

## What Each Deploy Step Does

1. **deploy:env** - Uploads `.env.production` → server's `.env`
2. **deploy:upload** - Syncs files (excludes node_modules, .git)
3. **deploy:install** - Runs `npm install --production` on server
4. **deploy:restart** - Restarts app with PM2 or npm start

## Quick Reference

**SSH Credentials:**
- Key: `~/.ssh/id_rsa_tmf`
- Passphrase: `tmfaiproduct`
- Server: `themzeni@192.64.117.125:21098`
- Remote Path: `/home/themzeni/ai.themetafuture.online/`
- Domain: `http://ai.themetafuture.online`

**Database:**
- User: `themzeni_ai`
- Database: `themzeni_tmfai`
