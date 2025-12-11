#!/bin/bash
# Persistent SSH Agent Setup for WSL Ubuntu
# This configures your shell to automatically start ssh-agent

SHELL_RC=""

# Detect which shell you're using
if [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
else
    echo "Unsupported shell. Please add the configuration manually."
    exit 1
fi

echo "Configuring persistent SSH agent for: $SHELL_RC"

# Check if already configured
if grep -q "SSH_AUTH_SOCK" "$SHELL_RC" 2>/dev/null; then
    echo "SSH agent configuration already exists in $SHELL_RC"
    exit 0
fi

# Add SSH agent configuration
cat >> "$SHELL_RC" << 'EOF'

# SSH Agent Configuration (auto-start)
SSH_ENV="$HOME/.ssh/agent-environment"

function start_agent {
    echo "Initializing new SSH agent..."
    /usr/bin/ssh-agent | sed 's/^echo/#echo/' > "${SSH_ENV}"
    echo succeeded
    chmod 600 "${SSH_ENV}"
    . "${SSH_ENV}" > /dev/null
}

# Source SSH settings, if applicable
if [ -f "${SSH_ENV}" ]; then
    . "${SSH_ENV}" > /dev/null
    ps -ef | grep ${SSH_AGENT_PID} | grep ssh-agent$ > /dev/null || {
        start_agent;
    }
else
    start_agent;
fi
EOF

echo "✓ SSH agent configuration added to $SHELL_RC"
echo ""
echo "To activate it now, run:"
echo "  source $SHELL_RC"
echo ""
echo "After that, add your key with:"
echo "  ssh-add ~/.ssh/id_rsa_tmf"
echo "  (Enter passphrase: tmfaiproduct)"
