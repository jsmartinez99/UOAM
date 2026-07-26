# GitHub MCP Server - Universal Configuration Guide

## 🚀 Universal MCP Server Setup

This guide provides configuration examples for using GitHub MCP Server with various LLM clients that support the Model Context Protocol (MCP).

---

## 📋 **Prerequisites**

✅ Node.js v24.4.1 (managed by fnm)  
✅ GitHub MCP Server built (`npm run build`)  
✅ Universal startup script (`start-mcp.sh`)

---

## 🔧 **Configuration for Different LLM Clients**

### 1. **Claude Desktop (Anthropic)**

**File**: `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/.config/claude/claude_desktop_config.json` (Linux/Mac)

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

### 2. **Continue (VS Code Extension)**

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

### 3. **Open WebUI**

**Configuration**: In Open WebUI Admin Panel → Tools → MCP Servers

```json
{
  "name": "github-mcp-server",
  "command": ["bash", "/home/simplysabir/desktop/shariq-projects/github-mcp-server/start-mcp.sh"],
  "env": {},
  "description": "GitHub MCP Server for Git operations"
}
```

### 4. **Zed Editor**

**File**: `~/.config/zed/settings.json`

```json
{
  "assistant": {
    "mcp_servers": {
      "github-mcp-server": {
        "command": "bash",
        "args": ["/home/simplysabir/desktop/shariq-projects/github-mcp-server/start-mcp.sh"],
        "env": {}
      }
    }
  }
}
```

### 5. **Cursor IDE**

**File**: `~/.cursor/mcp_config.json`

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "command": "npx",
      "args": ["github-mcp-server", "mcp"],
      "env": {},
      "capabilities": ["tools", "resources", "prompts"]
    }
  }
}
```

### 6. **Generic MCP Client**

For any MCP-compatible client:

```bash
# Direct command execution
bash /home/simplysabir/desktop/shariq-projects/github-mcp-server/start-mcp.sh

# Or with explicit shell
/bin/bash /home/simplysabir/desktop/shariq-projects/github-mcp-server/start-mcp.sh
```

---

## 🔧 **Environment Variables**

The startup script sets these environment variables automatically:

```bash
NODE_ENV=production
MCP_SERVER_NAME=github-mcp-server
MCP_SERVER_VERSION=1.8.3
FNM_PATH=$HOME/.local/share/fnm
```

---

## 🛠️ **Platform-Specific Notes**

### **Windows (WSL)**
- Use `wsl` command prefix for Windows clients
- Ensure WSL has access to the project directory
- Path should use forward slashes: `/home/user/...`

### **Linux/macOS**
- Use direct `bash` command
- Ensure script has executable permissions: `chmod +x start-mcp.sh`
- Path can use native format

### **Docker Alternative**
```json
{
  "command": "docker",
  "args": [
    "run", "--rm", "-i",
    "-v", "/home/simplysabir/desktop/shariq-projects/github-mcp-server:/app",
    "-w", "/app",
    "node:24.4.1-alpine",
    "node", "dist/index.js"
  ]
}
```

---

## ✅ **Verification**

Test the setup with any client:

1. **Check Node.js version**: Should be v24.4.1
2. **Verify MCP tools**: Should list 29 Git operations
3. **Test basic operation**: Try `git-status` tool
4. **Check logs**: Look for startup messages in client

---

## 🚨 **Troubleshooting**

### Common Issues:

1. **"Node not found"**
   ```bash
   # Reload shell environment
   source ~/.bashrc
   fnm use 24.4.1
   ```

2. **"Permission denied"**
   ```bash
   chmod +x /home/simplysabir/desktop/shariq-projects/github-mcp-server/start-mcp.sh
   ```

3. **"Directory not found"**
   - Update `PROJECT_DIR` in `start-mcp.sh`
   - Ensure all paths are absolute

4. **"Server exits immediately"**
   - Check if `dist/index.js` exists
   - Run `npm run build` to rebuild

---

## 📚 **Available Tools**

After successful setup, these tools will be available:

### Basic Operations (15)
`git-add`, `git-commit`, `git-push`, `git-pull`, `git-status`, `git-branch`, `git-checkout`, `git-log`, `git-diff`, `git-stash`, `git-stash-pop`, `git-reset`, `git-clone`, `git-remote`, `git-init`

### Advanced Operations (14)
`git-tag`, `git-merge`, `git-rebase`, `git-cherry-pick`, `git-blame`, `git-bisect-start`, `git-bisect-bad`, `git-bisect-good`, `git-bisect-reset`, `git-show`, `git-reflog`, `git-clean`, `git-archive`, `git-worktree`

All tools include comprehensive error handling, validation, and helpful output formatting.
