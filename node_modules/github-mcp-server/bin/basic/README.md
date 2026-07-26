# Basic Git Operations

This directory contains **17 essential daily Git commands** that every developer uses regularly. These are the fundamental building blocks of version control workflows, designed for clarity and ease of use.

## � Operations Overview

| Category | Operations | Description |
|----------|------------|-------------|
| **📝 File Management** | `gadd`, `gstatus` | Stage files and check repository status |
| **💾 Commit & Sync** | `gcommit`, `gpush`, `gpull` | Create commits and sync with remotes |
| **🌿 Branch Management** | `gbranch`, `gcheckout` | Create, list, and switch branches |
| **📊 Information** | `glog`, `gdiff` | View history and compare changes |
| **💼 Stash Operations** | `gstash`, `gpop` | Temporarily save and restore work |
| **🔄 Reset Operations** | `greset` | Reset repository state |
| **📂 Repository** | `ginit`, `gclone` | Initialize and clone repositories |
| **📡 Remote Management** | `gremote` | Comprehensive remote management |

## 📝 File Management

### `gadd` - Add Files to Staging Area
**Purpose:** Stage files for commit  
**Git Equivalent:** `git add`

```bash
gadd                    # Add all modified files (git add .)
gadd file1.js file2.js  # Add specific files
gadd src/               # Add entire directory
```

**When to use:** Before every commit to stage your changes

### `gstatus` - Check Repository Status
**Purpose:** View current repository state  
**Git Equivalent:** `git status`

```bash
gstatus                 # Shows staged, modified, and untracked files
```

**Output includes:** Modified files, staged files, untracked files, current branch

## 💾 Commit & Sync Operations

### `gcommit` - Create Commits
**Purpose:** Save staged changes with a message  
**Git Equivalent:** `git commit -m`

```bash
gcommit "fix authentication bug"     # Standard commit
gcommit "feat: add user dashboard"   # Conventional commit format
gcommit "docs: update API reference" # Documentation update
```

**Best practices:** Use clear, descriptive messages; follow conventional commit format

### `gpush` - Push to Remote
**Purpose:** Upload local commits to remote repository  
**Git Equivalent:** `git push`

```bash
gpush                   # Push current branch to origin
```

**Use after:** Committing changes you want to share

### `gpull` - Pull from Remote
**Purpose:** Download and merge remote changes  
**Git Equivalent:** `git pull`

```bash
gpull                   # Pull and merge latest changes
```

**Use before:** Starting work to get latest updates

## 🌿 Branch Management

### `gbranch` - Branch Operations
**Purpose:** List and create branches  
**Git Equivalent:** `git branch`

```bash
gbranch                 # List all branches (* shows current)
gbranch feature-auth    # Create new branch from current HEAD
gbranch -d old-feature  # Delete merged branch
```

**Branch naming:** Use descriptive names like `feature-login`, `fix-header-bug`

### `gcheckout` - Switch Branches
**Purpose:** Change working branch  
**Git Equivalent:** `git checkout` / `git switch`

```bash
gcheckout main          # Switch to main branch
gcheckout feature-auth  # Switch to existing branch
gcheckout -b new-feature # Create and switch to new branch
```

**Safety tip:** Commit or stash changes before switching branches

## 📊 Information & History

### `glog` - View Commit History
**Purpose:** Display commit history with details  
**Git Equivalent:** `git log --oneline --graph`

```bash
glog                    # Show recent commits (default: 10)
glog 25                 # Show last 25 commits
glog --author="John"    # Show commits by specific author
```

**Output format:** Commit hash, author, date, message

### `gdiff` - Show Differences
**Purpose:** Compare changes between commits, branches, or files  
**Git Equivalent:** `git diff`

```bash
gdiff                   # Show unstaged changes
gdiff --staged          # Show staged changes
gdiff main              # Compare current branch with main
gdiff HEAD~1            # Compare with previous commit
gdiff file.js           # Show changes in specific file
```

**Use cases:** Review changes before committing, compare branches

## 💼 Stash Operations

### `gstash` - Save Work Temporarily
**Purpose:** Temporarily store uncommitted changes  
**Git Equivalent:** `git stash`

```bash
gstash                  # Stash current changes with auto message
gstash "work in progress on auth"  # Stash with custom message
gstash --include-untracked  # Include untracked files
```

**When to use:** Need to switch branches but work isn't ready to commit

### `gpop` - Restore Stashed Work
**Purpose:** Apply and remove most recent stash  
**Git Equivalent:** `git stash pop`

```bash
gpop                    # Apply most recent stash and remove it
```

**Note:** Resolves conflicts if any exist between stash and current state

## 🔄 Reset Operations

### `greset` - Reset Repository State
**Purpose:** Undo commits or unstage files  
**Git Equivalent:** `git reset`

```bash
greset                  # Unstage all files (soft reset to HEAD)
greset --soft HEAD~1    # Undo last commit, keep changes staged
greset --mixed HEAD~1   # Undo last commit, unstage changes
greset --hard HEAD~1    # ⚠️ DANGER: Undo last commit, discard changes
greset file.js          # Unstage specific file
```

**⚠️ Warning:** `--hard` permanently deletes uncommitted changes

## 📂 Repository Operations

### `ginit` - Initialize Repository
**Purpose:** Create new Git repository in current directory  
**Git Equivalent:** `git init`

```bash
ginit                   # Initialize current directory as Git repo
```

**Creates:** `.git` directory with repository structure

### `gclone` - Clone Repository
**Purpose:** Copy remote repository to local machine  
**Git Equivalent:** `git clone`

```bash
gclone https://github.com/user/repo.git
gclone git@github.com:user/repo.git my-folder
gclone <url> --depth 1  # Shallow clone (latest commit only)
```

**Protocols:** HTTPS (requires credentials), SSH (requires key setup)

## 📡 Remote Management

### `gremote` - Comprehensive Remote Management
**Purpose:** Manage remote repository connections  
**Git Equivalent:** Various `git remote` commands

```bash
# List operations
gremote                           # List all remotes with URLs
gremote -v                        # Verbose output with fetch/push URLs

# Add operations
gremote add upstream <url>        # Add new remote named 'upstream'
gremote add origin <url>          # Add new origin remote

# Remove operations
gremote remove old-remote         # Remove remote connection
gremote remove upstream           # Remove upstream remote

# Update operations
gremote set-url <url>             # Update origin URL (default remote)
gremote set-url <url> upstream    # Update specific remote URL
```

**Common patterns:**
- **Origin:** Your main remote repository
- **Upstream:** Original repository when working with forks
- **Multiple remotes:** For complex workflows with multiple repositories

## 🎯 Common Workflow Patterns

### Starting a New Project
```bash
mkdir my-project && cd my-project
ginit                           # Initialize Git repository
# Create initial files
gadd                            # Stage all files
gcommit "initial commit"        # First commit
gremote add origin <repo-url>   # Connect to remote
gpush                           # Push to remote
```

### Daily Development Cycle
```bash
# Start of day
gpull                           # Get latest changes
gstatus                         # Check current state

# During development
gadd                            # Stage changes
gcommit "implement user login"  # Commit with clear message
gpush                           # Share your work
```

### Feature Branch Workflow
```bash
# Create feature branch
gbranch feature-authentication  # Create new branch
gcheckout feature-authentication # Switch to it

# Work on feature
# ... make changes ...
gadd && gcommit "add login form"
gadd && gcommit "add validation"
gpush                           # Push feature branch

# Merge back to main
gcheckout main
gpull                           # Get latest main
# Merge feature (via PR/MR or locally)
```

### Emergency Stash Workflow
```bash
# Working on feature, need to fix urgent bug
gstash "WIP: user dashboard feature"  # Save current work
gcheckout main                        # Switch to main
gpull                                 # Get latest
gcheckout -b hotfix-login-bug        # Create hotfix branch
# ... fix the bug ...
gadd && gcommit "fix login redirect bug"
gpush                                 # Push hotfix

# Return to feature work
gcheckout feature-dashboard           # Back to feature
gpop                                  # Restore work in progress
```

### Repository History Investigation
```bash
gstatus                         # What's currently changed?
glog                            # Recent commit history
glog --author="teammate"        # What did teammate work on?
gdiff main                      # How does my branch differ from main?
gdiff HEAD~1                    # What changed in last commit?
```

## 🎓 Learning Path for New Developers

### Level 1: Basics (Start Here)
1. **`ginit`** - Create your first repository
2. **`gstatus`** - Always know what's happening
3. **`gadd`** - Stage your changes
4. **`gcommit`** - Save your progress
5. **`glog`** - See your commit history

### Level 2: Collaboration
6. **`gremote`** - Connect to GitHub/GitLab
7. **`gpush`** - Share your work
8. **`gpull`** - Get others' work
9. **`gclone`** - Copy existing projects

### Level 3: Branching
10. **`gbranch`** - Organize your work
11. **`gcheckout`** - Switch between features
12. **`gdiff`** - Compare different versions

### Level 4: Advanced
13. **`gstash`/`gpop`** - Temporary work storage
14. **`greset`** - Fix mistakes (carefully!)

## 💡 Pro Tips

### Before You Start
- Always run `gstatus` to understand current state
- Use `glog` to see recent history when joining a project
- Check remotes with `gremote` to understand repository connections

### During Development
- Commit frequently with `gadd` + `gcommit`
- Use descriptive commit messages that explain **why**, not just **what**
- Push regularly to backup your work and enable collaboration

### When Things Go Wrong
- Use `gstash` to quickly save work when switching contexts
- Use `greset` (without `--hard`) to unstage files safely
- Use `gdiff` to understand what changed before committing

### Team Collaboration
- Always `gpull` before starting new work
- Use branches for features: `gbranch feature-name`
- Keep commit history clean with meaningful messages

## 🔗 Related Documentation

- **[Advanced Operations](../advanced/README.md)** - Complex workflows and automation
- **[Installation Guide](../../markdown/INSTALLATION.md)** - Setup instructions
- **[Quick Reference](../../markdown/QUICK_REFERENCES.md)** - Command cheat sheet

These basic operations provide the foundation for all Git workflows. Master these before exploring advanced operations and automation tools.
