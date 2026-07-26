#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * GitHub MCP Server CLI Wrapper
 * 
 * This CLI provides easy access to all Git operations through the MCP server.
 * Operations are organized into basic and advanced categories matching the
 * bin/ directory structure.
 * 
 * Directory Structure:
 * - bin/basic/     - 15 essential Git operations for daily development
 * - bin/advanced/  - 13 sophisticated workflows and automation tools
 * 
 * @version 1.8.0
 */

// Available tools in the MCP server (29 total operations)
const AVAILABLE_TOOLS = [
  // === BASIC GIT OPERATIONS (bin/basic/) ===
  { name: 'git-init', category: 'Basic: File Operations', binPath: 'basic/ginit.js', description: 'Initialize a new Git repository' },
  { name: 'git-add-all', category: 'Basic: File Operations', binPath: 'basic/gadd.js', description: 'Add all files to staging' },
  { name: 'git-add', category: 'Basic: File Operations', binPath: 'basic/gadd.js', description: 'Add specific files to staging', usage: 'git-add <files...>' },
  { name: 'git-status', category: 'Basic: Information', binPath: 'basic/gstatus.js', description: 'Show repository status' },
  { name: 'git-log', category: 'Basic: Information', binPath: 'basic/glog.js', description: 'Show commit history', usage: 'git-log [count]' },
  { name: 'git-diff', category: 'Basic: Information', binPath: 'basic/gdiff.js', description: 'Show differences', usage: 'git-diff [target]' },
  { name: 'git-commit', category: 'Basic: Commit & Sync', binPath: 'basic/gcommit.js', description: 'Commit staged changes', usage: 'git-commit <message>' },
  { name: 'git-push', category: 'Basic: Commit & Sync', binPath: 'basic/gpush.js', description: 'Push to remote repository' },
  { name: 'git-pull', category: 'Basic: Commit & Sync', binPath: 'basic/gpull.js', description: 'Pull from remote repository' },
  { name: 'git-branch', category: 'Basic: Branch Management', binPath: 'basic/gbranch.js', description: 'List branches or create new one', usage: 'git-branch [name]' },
  { name: 'git-checkout', category: 'Basic: Branch Management', binPath: 'basic/gcheckout.js', description: 'Switch to branch', usage: 'git-checkout <name>' },
  { name: 'git-stash', category: 'Basic: Stash Operations', binPath: 'basic/gstash.js', description: 'Stash current changes', usage: 'git-stash [message]' },
  { name: 'git-stash-pop', category: 'Basic: Stash Operations', binPath: 'basic/gpop.js', description: 'Apply most recent stash' },
  { name: 'git-reset', category: 'Basic: Reset Operations', binPath: 'basic/greset.js', description: 'Reset repository state', usage: 'git-reset [mode] [target]' },
  { name: 'git-clone', category: 'Basic: Repository Operations', binPath: 'basic/gclone.js', description: 'Clone repository', usage: 'git-clone <url> [dir]' },
  { name: 'git-remote-list', category: 'Basic: Remote Management', binPath: 'basic/gremote.js', description: 'List all remote repositories' },
  { name: 'git-remote-add', category: 'Basic: Remote Management', binPath: 'basic/gremote-add.js', description: 'Add remote repository', usage: 'git-remote-add <name> <url>' },
  { name: 'git-remote-remove', category: 'Basic: Remote Management', binPath: 'basic/gremote-remove.js', description: 'Remove remote repository', usage: 'git-remote-remove <name>' },
  { name: 'git-remote-set-url', category: 'Basic: Remote Management', binPath: 'basic/gremote-set-url.js', description: 'Change remote URL', usage: 'git-remote-set-url <name> <url>' },
  
  // === ADVANCED GIT OPERATIONS (bin/advanced/) ===
  { name: 'git-flow', category: 'Advanced: Workflow Combinations', binPath: 'advanced/gflow.js', description: 'Complete workflow (add→commit→push)', usage: 'git-flow <message>' },
  { name: 'git-quick-commit', category: 'Advanced: Workflow Combinations', binPath: 'advanced/gquick.js', description: 'Quick commit with auto message', usage: 'git-quick-commit <message>' },
  { name: 'git-sync', category: 'Advanced: Workflow Combinations', binPath: 'advanced/gsync.js', description: 'Sync with remote (pull→push)' },
  { name: 'git-tag', category: 'Advanced: Advanced Operations', description: 'Manage Git tags', usage: 'git-tag [action] [name] [message]' },
  { name: 'git-merge', category: 'Advanced: Advanced Operations', description: 'Merge branch into current', usage: 'git-merge <branch> [strategy]' },
  { name: 'git-rebase', category: 'Advanced: Advanced Operations', description: 'Rebase current branch', usage: 'git-rebase [target] [--interactive]' },
  { name: 'git-cherry-pick', category: 'Advanced: Advanced Operations', description: 'Apply specific commit', usage: 'git-cherry-pick <commit>' },
  { name: 'git-blame', category: 'Advanced: Advanced Operations', description: 'Show line-by-line authorship', usage: 'git-blame <file> [range]' },
  { name: 'git-bisect', category: 'Advanced: Advanced Operations', description: 'Binary search for bugs', usage: 'git-bisect <action> [commit]' },
  { name: 'git-remove', category: 'Basic: File Operations', description: 'Remove file from staging', usage: 'git-remove <file>' },
  { name: 'git-remove-all', category: 'Basic: File Operations', description: 'Remove all files from staging' }
];

// CLI workflow combinations organized by directory structure
const WORKFLOW_COMBINATIONS = [
  // === BASIC WORKFLOW ALIASES (bin/basic/) - 15 aliases ===
  
  { alias: 'gstatus', command: 'git-status', binPath: 'basic/gstatus.js', description: 'Check repository status' },
  { alias: 'gadd', command: 'git-add-all', binPath: 'basic/gadd.js', description: 'Add all modified files' },
  { alias: 'gcommit', command: 'git-commit', binPath: 'basic/gcommit.js', description: 'Commit staged changes', usage: 'gcommit "message"' },
  { alias: 'gpush', command: 'git-push', binPath: 'basic/gpush.js', description: 'Push to remote repository' },
  { alias: 'gpull', command: 'git-pull', binPath: 'basic/gpull.js', description: 'Pull from remote repository' },
  { alias: 'gbranch', command: 'git-branch', binPath: 'basic/gbranch.js', description: 'List or create branches', usage: 'gbranch [name]' },
  { alias: 'gcheckout', command: 'git-checkout', binPath: 'basic/gcheckout.js', description: 'Switch branches', usage: 'gcheckout <name>' },
  { alias: 'glog', command: 'git-log', binPath: 'basic/glog.js', description: 'Show commit history', usage: 'glog [count]' },
  { alias: 'gdiff', command: 'git-diff', binPath: 'basic/gdiff.js', description: 'Show differences', usage: 'gdiff [target]' },
  { alias: 'gstash', command: 'git-stash', binPath: 'basic/gstash.js', description: 'Stash current changes', usage: 'gstash [message]' },
  { alias: 'gpop', command: 'git-stash-pop', binPath: 'basic/gpop.js', description: 'Apply most recent stash' },
  { alias: 'greset', command: 'git-reset', binPath: 'basic/greset.js', description: 'Reset repository state', usage: 'greset [mode] [target]' },
  { alias: 'gclone', command: 'git-clone', binPath: 'basic/gclone.js', description: 'Clone repository', usage: 'gclone <url> [dir]' },
  { alias: 'ginit', command: 'git-init', binPath: 'basic/ginit.js', description: 'Initialize Git repository' },
  { alias: 'gremote', command: 'git-remote-list', binPath: 'basic/gremote.js', description: 'Manage remote repositories', usage: 'gremote [add|remove|set-url] [args]' },
  
  // === ADVANCED WORKFLOW ALIASES (bin/advanced/) - 14 aliases ===
  { alias: 'gflow', command: 'git-flow', binPath: 'advanced/gflow.js', description: 'Complete workflow: add→commit→push', usage: 'gflow "message"' },
  { alias: 'gquick', command: 'git-quick-commit', binPath: 'advanced/gquick.js', description: 'Quick commit with auto message', usage: 'gquick "message"' },
  { alias: 'gsync', command: 'git-sync', binPath: 'advanced/gsync.js', description: 'Sync with remote (pull→push)' },
  { alias: 'gdev', command: 'git-dev', binPath: 'advanced/gdev.js', description: 'Development session management', usage: 'gdev [feature-name]' },
  { alias: 'gworkflow', command: 'git-workflow', binPath: 'advanced/gworkflow.js', description: 'Professional workflow combinations', usage: 'gworkflow <action> [args]' },
  { alias: 'gfix', command: 'git-fix', binPath: 'advanced/gfix.js', description: 'Smart fix and patch workflows', usage: 'gfix "message"' },
  { alias: 'gfresh', command: 'git-fresh', binPath: 'advanced/gfresh.js', description: 'Fresh start workflows', usage: 'gfresh [options]' },
  { alias: 'gbackup', command: 'git-backup', binPath: 'advanced/gbackup.js', description: 'Backup and safety operations', usage: 'gbackup [options]' },
  { alias: 'gclean', command: 'git-clean', binPath: 'advanced/gclean.js', description: 'Repository cleanup and optimization', usage: 'gclean [options]' },
  { alias: 'gsave', command: 'git-save', binPath: 'advanced/gsave.js', description: 'Save and preserve workflows', usage: 'gsave "description"' },
  { alias: 'glist', command: 'git-list', binPath: 'advanced/glist.js', description: 'Tool discovery and help system', usage: 'glist [category]' },
  { alias: 'grelease', command: 'git-release', binPath: 'advanced/grelease.js', description: 'Release management workflows', usage: 'grelease [version]' },
  
  // === SPECIALIZED ADVANCED TOOLS (MCP only - no bin files) ===
  { alias: 'gtag', command: 'git-tag', description: 'Manage Git tags', usage: 'gtag [action] [name] [message]' },
  { alias: 'gmerge', command: 'git-merge', description: 'Merge branch into current', usage: 'gmerge <branch> [strategy]' },
  { alias: 'grebase', command: 'git-rebase', description: 'Rebase current branch', usage: 'grebase [target] [--interactive]' },
  { alias: 'gcherry', command: 'git-cherry-pick', description: 'Apply specific commit', usage: 'gcherry <commit>' },
  { alias: 'gblame', command: 'git-blame', description: 'Show line-by-line authorship', usage: 'gblame <file> [range]' },
  { alias: 'gbisect', command: 'git-bisect', description: 'Binary search for bugs', usage: 'gbisect <action> [commit]' }
];

// MCP CLI wrapper
class MCPClient {
  constructor() {
    this.serverPath = path.join(__dirname, 'dist', 'index.js');
  }

  async listTools() {
    console.log('\n🚀 GitHub MCP Server - Git Operations CLI');
    console.log(`📊 Total: ${AVAILABLE_TOOLS.length} MCP operations + ${WORKFLOW_COMBINATIONS.length} CLI aliases\n`);
    
    // Show directory structure overview
    console.log('📁 Project Structure:');
    console.log('  bin/basic/     - 17 essential Git operations (17 aliases)');
    console.log('  bin/advanced/  - 13 sophisticated workflows (12 aliases + 6 MCP-only)');
    console.log('  MCP server     - All 29 operations accessible via direct MCP calls');
    console.log('');
    
    // Group tools by basic vs advanced
    const basicTools = AVAILABLE_TOOLS.filter(tool => tool.category.startsWith('Basic:'));
    const advancedTools = AVAILABLE_TOOLS.filter(tool => tool.category.startsWith('Advanced:'));
    
    // Basic operations
    console.log('📂 Basic Git Operations (bin/basic/):');
    const basicCategories = {};
    basicTools.forEach(tool => {
      const category = tool.category.replace('Basic: ', '');
      if (!basicCategories[category]) {
        basicCategories[category] = [];
      }
      basicCategories[category].push(tool);
    });
    
    Object.entries(basicCategories).forEach(([category, tools]) => {
      console.log(`  📝 ${category}:`);
      tools.forEach(tool => {
        const usage = tool.usage ? ` (${tool.usage})` : '';
        const binPath = tool.binPath ? ` [${tool.binPath}]` : '';
        console.log(`    ${tool.name.padEnd(18)} - ${tool.description}${usage}`);
      });
    });
    console.log('');
    
    // Advanced operations
    console.log('📂 Advanced Git Operations (bin/advanced/):');
    const advancedCategories = {};
    advancedTools.forEach(tool => {
      const category = tool.category.replace('Advanced: ', '');
      if (!advancedCategories[category]) {
        advancedCategories[category] = [];
      }
      advancedCategories[category].push(tool);
    });
    
    Object.entries(advancedCategories).forEach(([category, tools]) => {
      console.log(`  🚀 ${category}:`);
      tools.forEach(tool => {
        const usage = tool.usage ? ` (${tool.usage})` : '';
        const binPath = tool.binPath ? ` [${tool.binPath}]` : '';
        console.log(`    ${tool.name.padEnd(18)} - ${tool.description}${usage}`);
      });
    });
    console.log('');

    // CLI aliases organized by directory structure
    const basicAliases = WORKFLOW_COMBINATIONS.filter(combo => combo.binPath && combo.binPath.startsWith('basic/'));
    const advancedAliases = WORKFLOW_COMBINATIONS.filter(combo => combo.binPath && combo.binPath.startsWith('advanced/'));
    const mcpOnlyAliases = WORKFLOW_COMBINATIONS.filter(combo => !combo.binPath);
    
    console.log('⚡ CLI Workflow Combinations:');
    console.log(`📊 Total: ${WORKFLOW_COMBINATIONS.length} aliases (${basicAliases.length} basic + ${advancedAliases.length} advanced + ${mcpOnlyAliases.length} MCP-only)\n`);
    
    console.log('  📂 Basic Operations Aliases (bin/basic/):');
    basicAliases.forEach(combo => {
      const usage = combo.usage ? ` (${combo.usage})` : '';
      console.log(`    ${combo.alias.padEnd(15)} → ${combo.description}${usage}`);
    });
    console.log('');
    
    console.log('  � Advanced Workflow Aliases (bin/advanced/):');
    advancedAliases.forEach(combo => {
      const usage = combo.usage ? ` (${combo.usage})` : '';
      console.log(`    ${combo.alias.padEnd(15)} → ${combo.description}${usage}`);
    });
    console.log('');
    
    console.log('  🔧 Specialized Git Operations (MCP server only):');
    mcpOnlyAliases.forEach(combo => {
      const usage = combo.usage ? ` (${combo.usage})` : '';
      console.log(`    ${combo.alias.padEnd(15)} → ${combo.description}${usage}`);
    });
    console.log('');
    
    console.log('🔥 Usage Examples:');
    console.log('  📁 Basic Operations (bin/basic/):');
    console.log('    gstatus                                 # Check repository status');
    console.log('    gadd && gcommit "fix bug"              # Add and commit');
    console.log('    gpush                                   # Push to remote');
    console.log('    gbranch feature-auth                    # Create feature branch');
    console.log('    glog 5                                  # Show last 5 commits');
    console.log('');
    console.log('  🚀 Advanced Workflows (bin/advanced/):');
    console.log('    gflow "implement feature"               # Complete workflow (add→commit→push)');
    console.log('    gquick "fix typo"                      # Quick commit without push');
    console.log('    gsync                                   # Sync with remote (pull→push)');
    console.log('    gdev feature-auth                       # Start development session');
    console.log('    gbackup --emergency                     # Create comprehensive backup');
    console.log('    gclean --optimize                       # Clean and optimize repository');
    console.log('');
    console.log('  � Specialized Git Operations (MCP server):');
    console.log('    gtag create v1.0.0 "Release version"   # Create annotated tag');
    console.log('    gmerge feature-branch                   # Merge branch with conflict detection');
    console.log('    grebase main                            # Rebase current branch on main');
    console.log('    gcherry abc1234                         # Cherry-pick specific commit');
    console.log('    gblame src/app.js                       # Show line-by-line authorship');
    console.log('');
    console.log('  �📖 Learn More:');
    console.log('    📚 Basic operations:    bin/basic/README.md');
    console.log('    🚀 Advanced workflows:  bin/advanced/README.md');
    console.log('    📋 Quick reference:     QUICK_REFERENCES.md');
    console.log('    🖥️  CLI help:            node mcp-cli.js list');
    console.log('');
  }

  async callTool(toolName, args = {}) {
    return new Promise((resolve, reject) => {
      // Add current working directory to arguments if not specified
      if (!args.directory) {
        args.directory = process.cwd();
      }
      
      const message = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args }
      };

      const child = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd() // Ensure MCP server runs in current directory
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        if (errorOutput) {
          console.error('❌ Error:', errorOutput);
        }

        try {
          const response = JSON.parse(output);
          if (response.result && response.result.content && response.result.content[0]) {
            const contentText = response.result.content[0].text;
            
            try {
              const contentObj = JSON.parse(contentText);
              if (contentObj.content && contentObj.content[0]) {
                console.log(contentObj.content[0].text);
                resolve(contentObj.content[0].text);
              } else if (contentObj.success === false) {
                console.error('❌ Operation failed:', contentObj.message);
                reject(new Error(contentObj.message));
              } else {
                console.log(contentText);
                resolve(contentText);
              }
            } catch (parseError) {
              console.log(contentText);
              resolve(contentText);
            }
          } else if (response.error) {
            console.error('❌ MCP Error:', response.error.message);
            reject(new Error(response.error.message));
          } else {
            console.error('❌ Unexpected response format');
            reject(new Error('Unexpected response format'));
          }
        } catch (parseError) {
          console.error('❌ Parse error:', parseError.message);
          reject(parseError);
        }
      });

      child.on('error', (error) => {
        console.error('❌ Spawn error:', error.message);
        reject(error);
      });

      child.stdin.write(JSON.stringify(message) + '\n');
      child.stdin.end();
    });
  }
}

// CLI interface
async function main() {
  const [,, tool, ...argsArray] = process.argv;
  const client = new MCPClient();

  // Check if we're being called as an alias (from package.json bin)
  const scriptName = path.basename(process.argv[1]);
  let actualTool = tool;
  let actualArgs = argsArray;
  
  // If called as an alias (e.g., gstatus instead of node mcp-cli.js git-status)
  if (scriptName !== 'mcp-cli.js' && scriptName !== 'github-mcp-server' && scriptName !== 'gms') {
    actualTool = scriptName;
    actualArgs = [tool, ...argsArray].filter(Boolean); // Include original tool as first arg
  }

  // Show current directory context for better user awareness
  console.log(`📁 Working Directory: ${process.cwd().split('/').pop()}`);
  console.log(`🔗 Full Path: ${process.cwd()}`);

  if (!actualTool || actualTool === 'help' || actualTool === '--help' || actualTool === '-h') {
    await client.listTools();
    process.exit(0);
  }

  if (actualTool === 'list' || actualTool === 'ls') {
    await client.listTools();
    process.exit(0);
  }

  // Parse arguments based on tool type
  let parsedArgs = {};
  
  // First, check if this is an alias and convert to the MCP command or bin file
  const alias = WORKFLOW_COMBINATIONS.find(combo => combo.alias === actualTool);
  if (alias) {
    // If the alias has a binPath, execute the local file directly
    if (alias.binPath) {
      const fs = require('fs');
      const binFilePath = path.join(__dirname, 'bin', alias.binPath);
      
      if (fs.existsSync(binFilePath)) {
        console.log(`🔧 Executing: ${alias.alias} (${alias.binPath})`);
        
        const binProcess = spawn('node', [binFilePath, ...actualArgs], {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        binProcess.on('close', (code) => {
          process.exit(code);
        });
        
        binProcess.on('error', (error) => {
          console.error('💥 Execution failed:', error.message);
          process.exit(1);
        });
        
        return; // Exit early for bin file execution
      } else {
        console.error(`❌ Error: Bin file not found: ${binFilePath}`);
        process.exit(1);
      }
    }
    
    // For MCP-only operations (no binPath), use MCP command
    actualTool = alias.command;
  }

  if (actualArgs.length > 0) {
    const argString = actualArgs.join(' ');
    
    switch (actualTool) {
      case 'git-add':
        parsedArgs = { files: actualArgs };
        break;
      case 'git-commit':
        parsedArgs = { message: argString };
        break;
      case 'git-remove':
        parsedArgs = { file: actualArgs[0] };
        break;
      case 'git-branch':
        if (actualArgs[0]) parsedArgs = { branchName: actualArgs[0] };
        break;
      case 'git-checkout':
        parsedArgs = { 
          branchName: actualArgs[0],
          createNew: actualArgs.includes('--create') || actualArgs.includes('-b')
        };
        break;
      case 'git-log':
        if (actualArgs[0] && !isNaN(parseInt(actualArgs[0]))) {
          parsedArgs = { maxCount: parseInt(actualArgs[0]) };
        }
        break;
      case 'git-diff':
        if (actualArgs[0]) parsedArgs = { target: actualArgs[0] };
        break;
      case 'git-stash':
        if (actualArgs[0]) parsedArgs = { message: argString };
        break;
      case 'git-reset':
        if (actualArgs[0]) {
          parsedArgs = { mode: actualArgs[0] };
          if (actualArgs[1]) parsedArgs.target = actualArgs[1];
        }
        break;
      case 'git-clone':
        parsedArgs = { url: actualArgs[0] };
        if (actualArgs[1]) parsedArgs.targetDir = actualArgs[1];
        break;
      case 'git-remote-add':
        parsedArgs = { name: actualArgs[0], url: actualArgs[1] };
        break;
      case 'git-remote-remove':
        parsedArgs = { name: actualArgs[0] };
        break;
      case 'git-remote-set-url':
        parsedArgs = { name: actualArgs[0], url: actualArgs[1] };
        break;
      case 'git-flow':
        parsedArgs = { message: argString };
        break;
      case 'git-quick-commit':
        parsedArgs = { message: argString };
        break;
      case 'git-sync':
        // No arguments needed
        break;
      // Advanced Git operations
      case 'git-tag':
        if (actualArgs[0]) {
          parsedArgs = { action: actualArgs[0] };
          if (actualArgs[1]) parsedArgs.tagName = actualArgs[1];
          if (actualArgs[2]) parsedArgs.message = actualArgs.slice(2).join(' ');
        }
        break;
      case 'git-merge':
        if (actualArgs[0]) {
          parsedArgs = { branch: actualArgs[0] };
          if (actualArgs[1]) parsedArgs.strategy = actualArgs[1];
        }
        break;
      case 'git-rebase':
        if (actualArgs[0]) {
          parsedArgs = { target: actualArgs[0] };
          if (actualArgs.includes('--interactive') || actualArgs.includes('-i')) {
            parsedArgs.interactive = true;
          }
        }
        break;
      case 'git-cherry-pick':
        if (actualArgs[0]) parsedArgs = { commitHash: actualArgs[0] };
        break;
      case 'git-blame':
        if (actualArgs[0]) {
          parsedArgs = { filePath: actualArgs[0] };
          if (actualArgs[1]) parsedArgs.lineRange = actualArgs[1];
        }
        break;
      case 'git-bisect':
        if (actualArgs[0]) {
          parsedArgs = { action: actualArgs[0] };
          if (actualArgs[1]) parsedArgs.commit = actualArgs[1];
        }
        break;
      // Handle workflow aliases that don't have MCP equivalents yet
      case 'git-dev':
      case 'git-workflow':
      case 'git-fix':
      case 'git-fresh':
      case 'git-backup':
      case 'git-clean':
      case 'git-save':
      case 'git-list':
      case 'git-release':
        // These should have been handled by bin file execution above
        // If we reach here, it means the bin file wasn't found
        console.log(`❌ Error: Bin file not found for "${actualTool}"`);
        console.log(`💡 Available operations:`);
        console.log(`   Basic: gstatus, gadd, gcommit, gpush, gpull`);
        console.log(`   Advanced: gflow, gquick, gsync, gtag, gmerge`);
        process.exit(1);
        break;
    }
  }

  try {
    // Check if we're in a git repository for git operations (but not for clone or list operations)
    if (actualTool.startsWith('git-') && actualTool !== 'git-clone' && actualTool !== 'git-list') {
      const fs = require('fs');
      const path = require('path');
      
      // Check for .git directory
      let currentDir = process.cwd();
      let gitFound = false;
      
      while (currentDir !== '/' && currentDir !== '.') {
        if (fs.existsSync(path.join(currentDir, '.git'))) {
          gitFound = true;
          break;
        }
        currentDir = path.dirname(currentDir);
      }
      
      if (!gitFound) {
        console.error('❌ Error: Not in a Git repository. Initialize with "git init" or clone a repository.');
        process.exit(1);
      }
    }
    
    console.log(`🔧 Executing: ${actualTool}${actualArgs.length > 0 ? ' ' + actualArgs.join(' ') : ''}`);
    await client.callTool(actualTool, parsedArgs);
  } catch (error) {
    console.error('💥 Operation failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
