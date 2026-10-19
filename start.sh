#!/bin/bash
# Load nvm and start the development server
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Use the project's Node version
nvm use 2>/dev/null || nvm use default

# Run the requested command, or default to dev server
if [ $# -eq 0 ]; then
  npm run dev
else
  "$@"
fi
