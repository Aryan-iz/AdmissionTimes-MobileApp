const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Watch the parent workspace for shared mock data
config.watchFolders = [workspaceRoot]

// CRITICAL: Force Metro to resolve from mobile/node_modules ONLY
// This prevents version conflicts with the web app in the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules/.pnpm/node_modules'),
]

// Disable hierarchical lookup to prevent searching parent folders
config.resolver.disableHierarchicalLookup = false

module.exports = config
