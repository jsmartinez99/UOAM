# GitHub MCP Server
🔗 **[View on MCP Market](https://mcpmarket.com/server/github-git-assistant)**
<br />
🔗 **[View on MCP Registry](https://mcp.so/server/github-mcp-server/Sharique%20Chaudhary)**

A **Model Context Protocol (MCP) server** that provides **29 Git operations + 11 workflow combinations** for AI assistants and developers. This server exposes comprehensive Git repository management through a standardized interface, enabling AI models and developers to safely manage complex version control workflows.

## 🎯 About

**GitHub MCP Server** bridges AI assistants with Git repositories and provides powerful developer productivity tools. It provides:
- **Safe Git operations** through a standardized MCP interface (29 operations)
- **Complete version control** capabilities including advanced operations (tag, merge, rebase, cherry-pick, blame, bisect)
- **31 workflow combinations** for enhanced developer productivity
- **Advanced developer tools** (backup, cleanup, workflow automation)
- **Error handling and validation** to prevent common Git mistakes
- **Direct integration** with VS Code and AI assistants like GitHub Copilot
- **CLI wrapper** for terminal access and automation

## 🚀 Features Overview

This server provides comprehensive Git repository management through two main categories:

### 📁 **Basic Git Operations** (17 operations)
Essential daily Git commands organized in [`bin/basic/`](bin/basic/) - see **[Basic Operations Guide](bin/basic/README.md)** for detailed documentation.

- **File Management**: Add, remove files from staging area
- **Repository Information**: Status, history, differences
- **Commit Operations**: Create commits, push, pull
- **Branch Management**: Create, switch branches
- **Remote Management**: Add, remove, configure remotes
- **Stash Operations**: Temporarily save changes
- **Reset Operations**: Repository state management

### 🚀 **Advanced Git Operations** (12 operations) 
Sophisticated workflows and automation in [`bin/advanced/`](bin/advanced/) - see **[Advanced Workflows Guide](bin/advanced/README.md)** for comprehensive documentation.

- **Workflow Combinations**: Complete flows (add→commit→push), quick commits, sync operations
- **Development Tools**: Smart development workflows, backup systems
- **Advanced Git Features**: Tags, merging, rebasing, cherry-picking, blame, bisect
- **Maintenance & Safety**: Repository cleanup, optimization, backup management
- **Professional Workflows**: Release management, hotfix procedures, team collaboration

## 🛠️ Installation

### 🚀 Quick Start with npx (Recommended)

The fastest way to use GitHub MCP Server is with **npx** - no installation required!

```bash
# Basic Git operations
npx github-mcp-server gstatus
npx github-mcp-server gadd
npx github-mcp-server gcommit "your commit message"
npx github-mcp-server gpush

# Advanced workflows
npx github-mcp-server gflow "implement new feature"
npx github-mcp-server gsync
npx github-mcp-server gbackup

# Or use the short alias
npx gms gstatus
npx gms gflow "quick fix"
```

### 📦 Global Installation

For frequent use, install globally:

```bash
# Using npm
npm install -g github-mcp-server

# Using pnpm (recommended)
pnpm add -g github-mcp-server

# Then use directly
gstatus
gflow "your message"
gsync
```

### 🔧 Local Development Installation

**See [markdown/INSTALLATION.md](markdown/INSTALLATION.md)** for detailed installation guide for Windows, macOS, WSL, and all platforms.

## 🤖 MCP Server Integration (Cursor, Claude, etc.)

### 🎯 Cursor IDE에서 MCP 서버 사용하기

Cursor에서 GitHub MCP Server를 사용하려면 다음 설정을 추가하세요:

**File**: `~/.cursor/mcp_config.json`

#### 🔑 GitHub 토큰 설정 (권장)

GitHub 토큰을 설정하면 인증 오류 없이 Git 작업을 수행할 수 있습니다:

1. **GitHub Personal Access Token 생성**:
   - GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token" → "Generate new token (classic)"
   - 권한 설정: `repo`, `workflow`, `write:packages` 등 필요한 권한 선택
   - 토큰 생성 후 안전한 곳에 저장

2. **환경변수 설정**:
   - `GITHUB_TOKEN`: GitHub Personal Access Token
   - `GITHUB_USERNAME`: GitHub 사용자명 (선택사항, 기본값: 'git')

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "command": "npx",
      "args": ["github-mcp-server-mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_personal_access_token",
        "GITHUB_USERNAME": "your_github_username"
      },
      "capabilities": ["tools", "resources", "prompts"]
    }
  }
}
```

### 🔧 다른 MCP 클라이언트 설정

#### Claude Desktop
**File**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "command": "npx",
      "args": ["github-mcp-server", "mcp"],
      "env": {}
    }
  }
}
```

#### Continue (VS Code Extension)
**File**: `~/.continue/config.json`

```json
{
  "models": [
    {
      "title": "GitHub MCP Assistant",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "contextLength": 200000,
      "mcpServers": [
        {
          "name": "github-mcp-server",
          "command": "npx",
          "args": ["github-mcp-server", "mcp"],
          "env": {}
        }
      ]
    }
  ]
}
```

### 🚀 MCP 서버 직접 실행

npm 패키지로 설치된 MCP 서버를 직접 실행할 수도 있습니다:

```bash
# 글로벌 설치 후
npm install -g github-mcp-server
github-mcp-server mcp

# 또는 npx로 직접 실행
npx github-mcp-server mcp
```

### 📋 사용 가능한 MCP 도구들

MCP 서버를 통해 사용할 수 있는 29개 Git 작업:

- **기본 작업**: git-status, git-add, git-commit, git-push, git-pull
- **브랜치 관리**: git-branch, git-checkout, git-merge, git-rebase
- **고급 작업**: git-tag, git-cherry-pick, git-blame, git-bisect
- **워크플로우**: git-flow, git-sync, git-backup, git-clean

**자세한 설정은 [markdown/MCP_UNIVERSAL_CONFIG.md](markdown/MCP_UNIVERSAL_CONFIG.md)**를 참조하세요.

## 🚀 Quick Usage Guide

### 📁 Basic Git Operations

```bash
# Check repository status
npx github-mcp-server gstatus

# Add all files and commit
npx github-mcp-server gadd
npx github-mcp-server gcommit "your commit message"

# Push to remote
npx github-mcp-server gpush

# Pull from remote
npx github-mcp-server gpull

# Branch operations
npx github-mcp-server gbranch feature-auth
npx github-mcp-server gcheckout feature-auth

# View history and differences
npx github-mcp-server glog 5
npx github-mcp-server gdiff main
```

### 🚀 Advanced Workflows

```bash
# Complete workflow (add → commit → push)
npx github-mcp-server gflow "implement new feature"

# Quick commit without push
npx github-mcp-server gquick "fix typo"

# Sync with remote (pull → push)
npx github-mcp-server gsync

# Development session management
npx github-mcp-server gdev feature-auth

# Backup and safety
npx github-mcp-server gbackup --emergency

# Repository cleanup
npx github-mcp-server gclean --optimize
```

### 🔧 Specialized Git Operations

```bash
# Tag management
npx github-mcp-server gtag create v1.0.0 "Release version"

# Merge operations
npx github-mcp-server gmerge feature-branch

# Rebase operations
npx github-mcp-server grebase main

# Cherry-pick specific commit
npx github-mcp-server gcherry abc1234

# Line-by-line authorship
npx github-mcp-server gblame src/app.js
```

### 📚 Help and Discovery

```bash
# List all available operations
npx github-mcp-server list

# Get help for specific operation
npx github-mcp-server help

# Show basic operations
npx github-mcp-server glist basic

# Show advanced workflows
npx github-mcp-server glist advanced
```

## 🏗️ Project Structure & Architecture

**GitHub MCP Server** is organized for clarity and progressive learning:

```
github-mcp-server/
├── src/
│   ├── index.ts              # MCP server (29 tool registrations, schema definitions)
│   └── github.ts             # Git operations engine (all 29 implementations)
├── bin/
│   ├── basic/                # 📁 17 Essential Git Operations
│   │   ├── README.md         # Comprehensive basic operations guide
│   │   ├── gadd.js           # Add files (git add)
│   │   ├── gcommit.js        # Create commits (git commit)
│   │   ├── gpush.js          # Push changes (git push)
│   │   ├── gpull.js          # Pull changes (git pull)
│   │   ├── gstatus.js        # Repository status (git status)
│   │   ├── gbranch.js        # Branch management (git branch)
│   │   ├── gcheckout.js      # Branch switching (git checkout)
│   │   ├── glog.js           # Commit history (git log)
│   │   ├── gdiff.js          # Show differences (git diff)
│   │   ├── gstash.js         # Stash operations (git stash)
│   │   ├── gpop.js           # Apply stash (git stash pop)
│   │   ├── greset.js         # Reset operations (git reset)
│   │   ├── gclone.js         # Clone repositories (git clone)
│   │   ├── gremote.js        # Remote management (git remote)
│   │   └── ginit.js          # Initialize repository (git init)
│   └── advanced/             # 🚀 13 Advanced Workflows & Automation
│       ├── README.md         # Comprehensive advanced workflows guide
│       ├── gflow.js          # Complete workflow (add→commit→push)
│       ├── gquick.js         # Quick commit workflow
│       ├── gsync.js          # Sync workflow (pull→push)
│       ├── gdev.js           # Development session management
│       ├── gworkflow.js      # Professional workflow combinations
│       ├── gfix.js           # Smart fix and patch workflows
│       ├── gfresh.js         # Fresh start workflows
│       ├── gbackup.js        # Backup and safety operations
│       ├── gclean.js         # Repository cleanup and optimization
│       ├── gsave.js          # Save and preserve workflows
│       ├── glist.js          # Tool discovery and help system
│       ├── grelease.js       # Release management workflows
│       └── common.js         # Shared utilities and helpers
├── markdown/
│   ├── INSTALLATION.md      # Detailed installation guide
│   ├── DEPLOY.md            # Production deployment guide
│   ├── DOCKER.md            # Docker setup and deployment guide
│   └── QUICK_REFERENCES.md  # Copy-paste command reference
├── mcp-cli.js               # Enhanced CLI wrapper (organized by structure)
├── package.json             # Project configuration & npm scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This comprehensive guide
```

## 📖 Documentation Structure

- **[bin/basic/README.md](bin/basic/README.md)** - Complete guide to 17 essential Git operations
- **[bin/advanced/README.md](bin/advanced/README.md)** - Comprehensive advanced workflows documentation  
- **[markdown/INSTALLATION.md](markdown/INSTALLATION.md)** - Step-by-step installation for all platforms
- **[markdown/MCP_UNIVERSAL_CONFIG.md](markdown/MCP_UNIVERSAL_CONFIG.md)** - Universal MCP configuration for all LLM clients
- **[markdown/QUICK_REFERENCES.md](markdown/QUICK_REFERENCES.md)** - Copy-paste commands for quick reference
- **[markdown/DOCKER.md](markdown/DOCKER.md)** - Docker setup, deployment, and containerization
- **[markdown/DEPLOY.md](markdown/DEPLOY.md)** - Production deployment and hosting strategies

## 🔧 Technical Architecture

### 📡 **MCP Server Core** (src/index.ts)
- **29 Tool Registrations** with complete JSON schemas
- **Enhanced Metadata** with operation tracking and performance monitoring
- **Input Validation** using Zod schemas for type safety
- **Error Handling Pipeline** with timeout protection and meaningful messages
- **Cross-platform Compatibility** with environment normalization

### ⚙️ **Git Operations Engine** (src/github.ts)
- **Comprehensive Implementation** of all 29 Git operations
- **Security Features** - Command injection prevention and input sanitization
- **Enhanced Error Handling** with context-aware messaging for common scenarios
- **Performance Monitoring** - Operation duration tracking and logging
- **Safety Checks** - Repository validation and file existence verification

### 🖥️ **Enhanced CLI System**
- **Smart Organization** - Tools categorized by basic vs advanced operations
- **Directory-Aware Help** - References to specific README files for detailed guidance
- **Progressive Learning** - Clear path from basic to advanced operations
- **Tool Discovery** - Enhanced `glist` command with category filtering

## 🛡️ Error Handling & Safety

- **🔍 Repository Validation**: Ensures directory is a valid Git repository
- **📁 File Existence Checks**: Validates files exist before Git operations
- **⏱️ Timeout Protection**: 30-second timeout for operations
- **🚫 Input Sanitization**: Prevents command injection
- **📝 Detailed Error Messages**: Clear, actionable error descriptions

## License
ISC License

## Author
Created for use with AI assistants that support the Model Context Protocol.
