# Advanced Git Operations & Workflows

This directory contains **12 sophisticated Git workflows** that combine multiple operations into powerful automation tools. These commands are designed for experienced developers who want to streamline complex development processes and implement professional Git practices.

## 📋 Operations Overview

| Category | Operations | Purpose |
|----------|------------|---------|
| **🔄 Workflow Automation** | `gflow`, `gquick`, `gsync` | Multi-step operations in single commands |
| **🛠️ Development Management** | `gdev`, `gfix`, `gfresh` | Smart development session workflows |
| **🚀 Professional Tools** | `gworkflow`, `grelease` | Enterprise-grade development processes |
| **🛡️ Safety & Maintenance** | `gbackup`, `gclean`, `gsave` | Repository health and data protection |
| **📊 Discovery & Analysis** | `glist` | Tool exploration and help system |

## 🔄 Workflow Automation

### `gflow` - Complete Git Flow
**Purpose:** Execute the full git workflow in one command  
**Basic Equivalent:** `gadd` + `gcommit` + `gpush`

```bash
gflow "implement user authentication"   # Stage all → commit → push
gflow "fix: resolve login bug"          # Conventional commit style
gflow "docs: update API documentation"  # Documentation updates
```

**Use cases:**
- Quick commits when all changes are ready
- Small feature implementations
- Bug fixes that don't require staging review

**Safety features:**
- Validates repository state before execution
- Confirms all changes will be committed
- Provides rollback information if push fails

### `gquick` - Quick Commit Workflow
**Purpose:** Fast local commits without pushing  
**Basic Equivalent:** `gadd` + `gcommit`

```bash
gquick "fix typo in header"             # Quick local commit
gquick "WIP: experimenting with layout" # Work-in-progress commits
gquick "save progress before lunch"     # Save points during development
```

**When to use:**
- Experimental changes you're not ready to push
- Frequent save points during development
- Local commits before review/testing

### `gsync` - Synchronization Workflow
**Purpose:** Stay synchronized with remote repository  
**Basic Equivalent:** `gpull` + `gpush`

```bash
gsync                                   # Pull latest, push local commits
gsync --force                           # Force push after rebase
gsync --dry-run                         # Show what would be synchronized
```

**Benefits:**
- Ensures you're working with latest code
- Shares your commits with team
- Handles common merge scenarios automatically

## 🛠️ Development Management

### `gdev` - Development Session Management
**Purpose:** Smart development session workflows with context awareness  
**Features:** Branch management, status checking, team synchronization

```bash
# Session management
gdev                                    # Check status, sync with latest
gdev --status                           # Comprehensive development status
gdev --sync                             # Advanced team synchronization

# Branch workflows
gdev feature-authentication             # Create and setup feature branch
gdev hotfix-login-bug                   # Emergency hotfix branch workflow
gdev --continue                         # Resume previous work session

# Team collaboration
gdev --team-sync                        # Sync with team's latest changes
gdev --branch-info                      # Show detailed branch information
```

**Development session features:**
- **Intelligent status checking** - Shows repository health, conflicts, remote status
- **Smart branch creation** - Creates branches with proper naming and base setup
- **Team synchronization** - Handles complex multi-developer scenarios
- **Work session restoration** - Restores previous work state with stash management

### `gfix` - Smart Fix & Patch Workflows
**Purpose:** Intelligent fix workflows for different scenarios  
**Features:** Context-aware fixes, hotfix procedures, commit amendments

```bash
# Quick fixes
gfix "correct variable name in auth.js" # Smart fix with auto-staging
gfix "update API endpoint URL"          # Single-purpose fixes
gfix --typo                             # Fix typo in last commit message

# Advanced fix workflows
gfix --hotfix "security vulnerability"  # Emergency hotfix branch workflow
gfix --amend                            # Safely amend last commit
gfix --revert HEAD~1                    # Smart revert with confirmation

# Interactive fixes
gfix --interactive                      # Choose files and fix strategy
gfix --patch                            # Patch-mode fixes for partial changes
```

**Hotfix workflow features:**
- Creates dedicated hotfix branch from main/master
- Applies fix with comprehensive testing checks
- Provides merge-back strategy for integration
- Creates backup tags before dangerous operations

### `gfresh` - Fresh Start Workflows
**Purpose:** Repository refresh and cleanup workflows  
**Features:** Safe resets, branch cleanup, workspace preparation

```bash
# Basic fresh start
gfresh                                  # Safe refresh: stash → pull → reset → status
gfresh --hard                           # ⚠️ Hard refresh (discards local changes)
gfresh --safe                           # Ultra-safe with multiple backups

# Branch-specific fresh start
gfresh --branch feature-new             # Fresh start on new branch from main
gfresh --switch main                    # Fresh start by switching to main
gfresh --sync-upstream                  # Refresh from upstream (for forks)

# Workspace preparation
gfresh --clean-workspace                # Clean untracked files and directories
gfresh --reset-config                   # Reset local Git configuration
```

**Safety mechanisms:**
- Always creates stash backup before destructive operations
- Validates remote connectivity before pulls
- Provides detailed preview of changes
- Offers rollback procedures for each operation

## 🚀 Professional Development Tools

### `gworkflow` - Professional Workflow Orchestration
**Purpose:** Complex multi-step workflows for professional development  
**Features:** Feature workflows, release procedures, review preparation

```bash
# Feature development workflows
gworkflow feature auth-system           # Complete feature development lifecycle
gworkflow feature-complete              # Finalize current feature for review

# Release workflows
gworkflow release 1.2.3                # Complete release preparation workflow
gworkflow release-prepare               # Validate and prepare for release
gworkflow hotfix-release 1.2.4         # Emergency hotfix release procedure

# Code review workflows
gworkflow review-prep                   # Prepare branch for code review
gworkflow review-update                 # Update branch based on review feedback
gworkflow merge-prep                    # Prepare for merge to main branch

# Team collaboration workflows
gworkflow sync-team                     # Advanced team synchronization
gworkflow conflict-resolve              # Guided conflict resolution workflow
```

**Feature workflow includes:**
1. **Branch creation** with proper naming conventions
2. **Development environment setup** with team standards
3. **Progressive commit strategies** with conventional commits
4. **Testing integration** and validation checks
5. **Review preparation** with cleanup and documentation
6. **Merge preparation** with conflict resolution

### `grelease` - Release Management System
**Purpose:** Comprehensive release management and versioning  
**Features:** Semantic versioning, release validation, deployment preparation

```bash
# Version management
grelease --patch                        # 1.0.0 → 1.0.1 (bug fixes)
grelease --minor                        # 1.0.0 → 1.1.0 (new features)
grelease --major                        # 1.0.0 → 2.0.0 (breaking changes)
grelease 2.1.0                          # Specific version release

# Release preparation
grelease --prepare                      # Comprehensive release readiness check
grelease --validate                     # Validate current state for release
grelease --preview 1.2.0               # Preview release changes

# Release execution
grelease --create-tag                   # Create release tag with metadata
grelease --generate-notes               # Generate release notes from commits
grelease --deploy-prep                  # Prepare for deployment
```

**Release preparation includes:**
- **Version validation** against semantic versioning rules
- **Dependency checking** for security vulnerabilities
- **Test suite execution** and coverage validation
- **Documentation updates** with changelog generation
- **Tag creation** with comprehensive metadata
- **Deployment preparation** with environment checks

## 🛡️ Safety & Maintenance Tools

### `gbackup` - Comprehensive Backup System
**Purpose:** Multi-layered backup strategies for data protection  
**Features:** Emergency backups, versioned backups, restoration procedures

```bash
# Automatic backup strategies
gbackup                                 # Smart backup (analyzes and chooses strategy)
gbackup --auto                          # Automated backup with timestamp

# Specific backup types
gbackup --branch                        # Create timestamped backup branch
gbackup --tag                           # Create versioned backup tag
gbackup --remote                        # Push backup to remote repository
gbackup --emergency                     # Complete backup: branch + tag + remote

# Backup management
gbackup --list                          # List all available backups
gbackup --list-branches                 # Show backup branches only
gbackup --list-tags                     # Show backup tags only

# Restoration procedures
gbackup --restore                       # Interactive restoration from backups
gbackup --restore-branch backup-20240126 # Restore from specific backup branch
gbackup --restore-tag v1.0.0-backup    # Restore from tagged backup
```

**Backup strategies:**
- **Branch backups** - Create working branches with current state
- **Tag backups** - Immutable snapshots with metadata
- **Remote backups** - Push to remote for off-site storage
- **Emergency backups** - Complete multi-layer backup for critical operations

### `gclean` - Repository Maintenance System
**Purpose:** Repository health management and optimization  
**Features:** Branch cleanup, performance optimization, health monitoring

```bash
# Repository analysis
gclean --stats                          # Comprehensive repository health report
gclean --analyze                        # Deep analysis with recommendations
gclean --size-report                    # Repository size breakdown

# Branch management
gclean --branches                       # Clean merged and stale branches
gclean --branches-dry-run               # Preview branch cleanup
gclean --branches-interactive           # Interactive branch cleanup

# Comprehensive cleanup
gclean --all                            # Complete repository cleanup
gclean --all --backup                   # Complete cleanup with safety backup
gclean --optimize                       # Performance optimization + garbage collection

# Maintenance workflows
gclean --maintenance                    # Scheduled maintenance routine
gclean --health-check                   # Repository health validation
```

**Cleanup procedures:**
- **Merged branch removal** with safety confirmations
- **Stale reference cleanup** for remote tracking branches
- **Garbage collection** for repository optimization
- **Large file identification** and cleanup recommendations
- **Configuration validation** and cleanup

### `gsave` - Smart Save & Preservation
**Purpose:** Intelligent work preservation with context awareness  
**Features:** Smart commits, work-in-progress management, backup integration

```bash
# Smart save operations
gsave                                   # Quick save with auto-generated message
gsave "implementing OAuth integration"  # Save with descriptive message
gsave --auto                            # Automatic save with intelligent messaging

# Work-in-progress management
gsave --wip                             # Mark as work-in-progress
gsave --wip "auth flow partially done"  # WIP with description
gsave --checkpoint                      # Create checkpoint for complex work

# Backup integration
gsave --push                            # Save and push to remote backup
gsave --backup                          # Save with local backup creation
gsave --emergency                       # Save with comprehensive backup
```

**Smart features:**
- **Intelligent commit messages** generated from file changes
- **Work categorization** (feature, fix, docs, etc.)
- **Backup integration** with automatic remote storage
- **Progress tracking** for long-running features

## 📊 Discovery & Analysis Tools

### `glist` - Advanced Tool Discovery System
**Purpose:** Comprehensive tool exploration and help system  
**Features:** Category filtering, usage examples, learning paths

```bash
# Basic discovery
glist                                   # Complete tool catalog with categories
glist --simple                          # Quick list without examples
glist --help                            # Advanced usage options

# Category filtering
glist --category "Workflow"             # Show workflow automation tools
glist --category "Safety"               # Show backup and safety tools
glist --category "Development"          # Show development management tools

# Learning and exploration
glist --basic                           # Show only basic operations
glist --advanced                        # Show only advanced operations
glist --examples                        # Detailed usage examples for all tools
glist --learning-path                   # Suggested learning progression

# Search and filtering
glist --search "commit"                 # Find tools related to commits
glist --tag "emergency"                 # Find emergency/urgent tools
```

**Discovery features:**
- **Organized categories** for logical tool grouping
- **Usage examples** with real-world scenarios
- **Learning paths** for skill progression
- **Search functionality** for specific needs
- **Integration guidance** for combining tools

## 🎓 Professional Development Workflows

### Enterprise Feature Development
```bash
# 1. Start feature development
gdev feature-user-dashboard             # Create feature branch with setup
gbackup --branch                        # Create safety backup

# 2. Development cycle
gsave "initial dashboard layout"        # Save progress points
gfix "correct responsive design"        # Quick fixes during development
gsave --checkpoint                      # Major milestone checkpoint

# 3. Review preparation
gworkflow review-prep                   # Prepare for code review
gclean --analyze                        # Ensure repository health

# 4. Release integration
gworkflow feature-complete              # Finalize feature
grelease --prepare                      # Validate for release
```

### Emergency Hotfix Procedure
```bash
# 1. Emergency backup
gbackup --emergency                     # Complete backup before hotfix

# 2. Hotfix workflow
gfix --hotfix "critical security patch" # Emergency hotfix branch
gsave --emergency                       # Save hotfix with backups

# 3. Validation and deployment
gworkflow hotfix-release 1.2.4         # Hotfix release workflow
grelease --deploy-prep                  # Prepare for emergency deployment
```

### Repository Maintenance Routine
```bash
# 1. Health assessment
gclean --stats                          # Repository health report
gbackup --list                          # Review backup status

# 2. Cleanup and optimization
gclean --branches                       # Clean stale branches
gclean --optimize                       # Performance optimization

# 3. Backup maintenance
gbackup --auto                          # Create fresh backup
gclean --maintenance                    # Scheduled maintenance
```

### Team Synchronization Workflow
```bash
# 1. Team status check
gdev --team-sync                        # Check team synchronization status
gfresh --sync-upstream                  # Sync with upstream (for forks)

# 2. Advanced synchronization
gworkflow sync-team                     # Advanced team sync procedures
gsync --force                           # Force synchronization if needed

# 3. Conflict resolution
gworkflow conflict-resolve              # Guided conflict resolution
gdev --status                           # Verify final synchronization state
```

## 🎯 Learning Path for Advanced Operations

### Prerequisites
- **Master all [basic operations](../basic/README.md)** first
- **Understand Git branching** concepts and workflows
- **Experience with team collaboration** and merge conflicts
- **Familiarity with semantic versioning** and release processes

### Level 1: Workflow Automation
1. **`gflow`** - Master the complete workflow
2. **`gquick`** - Learn quick local commits
3. **`gsync`** - Understand synchronization
4. **`gsave`** - Practice smart work preservation

### Level 2: Development Management  
5. **`gdev`** - Development session management
6. **`gfix`** - Smart fix workflows
7. **`gfresh`** - Repository refresh procedures
8. **`glist`** - Tool discovery and help

### Level 3: Professional Tools
9. **`gworkflow`** - Complex workflow orchestration
10. **`grelease`** - Release management system
11. **`gbackup`** - Comprehensive backup strategies
12. **`gclean`** - Repository maintenance and optimization

## 💡 Pro Tips for Advanced Usage

### Workflow Efficiency
- **Combine operations**: `gdev feature-auth && gsave --checkpoint`
- **Use backup before risky operations**: `gbackup --emergency`
- **Regular maintenance**: Schedule `gclean --maintenance` weekly
- **Smart commits**: Use `gsave` with descriptive messages

### Team Collaboration
- **Start each day**: `gdev --team-sync`
- **Before major changes**: `gbackup --branch`
- **Review preparation**: `gworkflow review-prep`
- **Release coordination**: `grelease --prepare`

### Emergency Procedures
- **Immediate backup**: `gbackup --emergency`
- **Hotfix workflow**: `gfix --hotfix "description"`
- **Safe recovery**: `gbackup --restore`
- **Health check**: `gclean --stats`

## 🔗 Integration with Basic Operations

These advanced tools are designed to work seamlessly with [basic operations](../basic/README.md):

- **`gflow`** enhances `gadd` + `gcommit` + `gpush`
- **`gdev`** builds upon `gstatus` + `gbranch` + `gpull`
- **`gfix`** extends `gcommit` + `greset` capabilities
- **`gbackup`** protects all basic operation workflows

Master the basic operations first, then gradually incorporate these advanced tools to build professional Git workflows that scale with team size and project complexity.
