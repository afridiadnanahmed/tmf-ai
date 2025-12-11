#!/bin/bash
# SSH Agent Setup Script for WSL Ubuntu
# This adds your SSH key to ssh-agent so you don't need to enter the passphrase repeatedly

echo "Setting up SSH agent..."

# Start ssh-agent if not already running
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)"
    echo "SSH agent started"
else
    echo "SSH agent already running"
fi

# Add your SSH key
echo "Adding SSH key ~/.ssh/id_rsa_tmf..."
echo "You will be prompted for your passphrase: tmfaiproduct"
ssh-add ~/.ssh/id_rsa_tmf

if [ $? -eq 0 ]; then
    echo "✓ SSH key added successfully!"
    echo "You can now run: npm run deploy"
else
    echo "✗ Failed to add SSH key"
    exit 1
fi
