#!/bin/bash
# Audio Analysis Laboratory Provisioning Script for Ubuntu 24.04
# Installs all required tools for arrangement verification

set -e

echo "=== Audio Analysis Laboratory Provisioning ==="
echo "Target: Ubuntu 24.04 LTS"
echo ""

# Check Ubuntu version
if ! grep -q "24.04" /etc/os-release; then
    echo "WARNING: This script is designed for Ubuntu 24.04"
    echo "Current: $(lsb_release -d)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update package list
echo "[1/8] Updating package list..."
sudo apt-get update

# Install core audio tools
echo "[2/8] Installing Sonic Visualiser, Audacity, Vamp SDK..."
sudo apt-get install -y \
    sonic-visualiser \
    audacity \
    vamp-plugin-sdk \
    vamp-hostsdk \
    libvamp-hostsdk3v5

# Install Python and scientific stack
echo "[3/8] Installing Python 3.12+ and scientific packages..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-numpy \
    python3-scipy \
    python3-matplotlib \
    python3-pandas \
    python3-librosa

# Create virtual environment for additional packages
echo "[4/8] Creating Python virtual environment..."
python3 -m venv ~/audio-lab-venv
source ~/audio-lab-venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install additional Python packages
echo "[5/8] Installing additional Python packages..."
pip install \
    librosa \
    pyloudnorm \
    typer \
    jinja2 \
    weasyprint \
    jsonschema \
    plotly \
    kaleido

# Try to install Essentia
echo "[6/8] Installing Essentia..."
pip install essentia-standard 2>/dev/null || \
pip install --index-url https://pypi.anaconda.org/simple essentia 2>/dev/null || \
echo "WARNING: Essentia installation may require manual steps. See https://essentia.upf.edu/installing.html"

# Try to install madmom
echo "[7/8] Installing madmom..."
pip install madmom 2>/dev/null || \
echo "WARNING: madmom installation may require additional dependencies (LLVM, etc.)"

# Install Chordino Vamp plugin
echo "[8/8] Installing Chordino Vamp plugin..."
cd /tmp
if [ ! -d "chordino" ]; then
    git clone --depth 1 https://github.com/cannam/chordino.git
fi
cd chordino
make -j$(nproc)
sudo make install
cd /
rm -rf /tmp/chordino

# Verify installations
echo ""
echo "=== Verification ==="
echo "Sonic Visualiser: $(sonic-visualiser --version 2>&1 | head -1)"
echo "Audacity: $(audacity --version 2>&1 | head -1)"
echo "Vamp plugins: $(vamp-simple-host -l 2>&1 | grep -c '^' || echo '0') plugins found"
echo "Python: $(python3 --version)"
echo "Python packages:"
source ~/audio-lab-venv/bin/activate
python3 -c "
import sys
pkgs = ['librosa', 'pyloudnorm', 'typer', 'jinja2', 'weasyprint', 'jsonschema', 'plotly', 'numpy', 'scipy', 'matplotlib', 'pandas']
for p in pkgs:
    try:
        __import__(p)
        print(f'  {p}: OK')
    except ImportError as e:
        print(f'  {p}: MISSING - {e}')
try:
    import essentia
    print(f'  essentia: OK (version {essentia.__version__})')
except ImportError:
    print('  essentia: MISSING')
try:
    import madmom
    print('  madmom: OK')
except ImportError:
    print('  madmom: MISSING')
"

echo ""
echo "=== Provisioning Complete ==="
echo ""
echo "To use the environment:"
echo "  source ~/audio-lab-venv/bin/activate"
echo ""
echo "For Sonic Visualiser with Vamp plugins:"
echo "  sonic-visualiser"
echo ""
echo "For Audacity CLI:"
echo "  audacity --help"