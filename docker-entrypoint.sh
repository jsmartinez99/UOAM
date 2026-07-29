#!/bin/bash
# Docker entrypoint for Audio Analysis Laboratory

set -e

echo "=== Audio Analysis Laboratory Container ==="
echo "Environment ready for arrangement verification"
echo ""

# Activate virtual environment
source /opt/venv/bin/activate

# Show available tools
echo "Available tools:"
echo "  sonic-visualiser: $(sonic-visualiser --version 2>&1 | head -1)"
echo "  audacity: $(audacity --version 2>&1 | head -1)"
echo "  vamp plugins: $(vamp-simple-host -l 2>&1 | wc -l) plugins"
echo "  python: $(python3 --version)"
echo ""

# Run command or start interactive shell
if [ $# -eq 0 ]; then
    exec bash
else
    exec "$@"
fi