/**
 * Environment Import Validation Test
 * Validates that the repository uses correct SvelteKit 2 $env syntax
 * and has no legacy virtual:env imports
 */

import { describe, it, expect } from 'vitest'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

describe('Environment Import Validation', () => {
  describe('No Legacy virtual:env Imports', () => {
    it('should not have any virtual:env imports in source files', async () => {
      const srcFiles = await getAllSourceFiles('src')
      const testFiles = await getAllSourceFiles('test')
      const allFiles = [...srcFiles, ...testFiles]

      for (const file of allFiles) {
        const content = await readFile(file, 'utf-8')
        
        // Check for virtual:env imports
        const virtualEnvMatches = content.match(/from\s+['"]virtual:env[^'"]*['"]/g)
        
        expect(virtualEnvMatches).toBeNull(
          `Found virtual:env import in ${file}: ${virtualEnvMatches?.join(', ')}`
        )
      }
    })

    it('should not have any import statements containing virtual:env', async () => {
      const srcFiles = await getAllSourceFiles('src')
      const testFiles = await getAllSourceFiles('test')
      const allFiles = [...srcFiles, ...testFiles]

      for (const file of allFiles) {
        const content = await readFile(file, 'utf-8')
        
        // Check for any mention of virtual:env in import context
        const lines = content.split('\n')
        const importLines = lines.filter(line => 
          line.trim().startsWith('import') && line.includes('virtual:env')
        )
        
        expect(importLines).toHaveLength(0, 
          `Found virtual:env in import statements in ${file}: ${importLines.join('\n')}`
        )
      }
    })
  })

  describe('Correct $env Usage', () => {
    it('should use $env/static/public for Supabase environment variables', async () => {
      const supabaseFile = join(process.cwd(), 'src/lib/supabase.ts')
      const content = await readFile(supabaseFile, 'utf-8')
      
      // Should import from $env/static/public
      expect(content).toMatch(/from\s+['"]\$env\/static\/public['"]/)
      
      // Should import the correct Supabase variables
      expect(content).toMatch(/PUBLIC_SUPABASE_URL/)
      expect(content).toMatch(/PUBLIC_SUPABASE_ANON_KEY/)
    })

    it('should use correct $env syntax in server environment validation', async () => {
      const envFile = join(process.cwd(), 'src/lib/server/env.ts')
      const content = await readFile(envFile, 'utf-8')
      
      // Should import from $env/static/public for static vars
      expect(content).toMatch(/from\s+['"]\$env\/static\/public['"]/)
      
      // Should import from $env/dynamic/public for dynamic vars
      expect(content).toMatch(/from\s+['"]\$env\/dynamic\/public['"]/)
    })

    it('should properly mock $env in test setup', async () => {
      const setupFile = join(process.cwd(), 'test/setup.ts')
      const content = await readFile(setupFile, 'utf-8')
      
      // Should mock $env/static/public
      expect(content).toMatch(/vi\.mock\s*\(\s*['"]\$env\/static\/public['"]/)
      
      // Should provide mock values for Supabase vars
      expect(content).toMatch(/PUBLIC_SUPABASE_URL/)
      expect(content).toMatch(/PUBLIC_SUPABASE_ANON_KEY/)
    })
  })

  describe('TypeScript Safety', () => {
    it('should have type-safe environment variable imports', async () => {
      const files = await getAllSourceFiles('src')
      
      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.svelte')) continue
        
        const content = await readFile(file, 'utf-8')
        
        // Check for any environment variable imports
        const envImports = content.match(/from\s+['"]\$env\/[^'"]+['"]/g)
        
        if (envImports) {
          // All $env imports should be from valid modules
          for (const importStatement of envImports) {
            expect(importStatement).toMatch(
              /from\s+['"]\$env\/(static|dynamic)\/(public|private)['"]/ ,
              `Invalid $env import in ${file}: ${importStatement}`
            )
          }
        }
      }
    })
  })

  describe('Supabase Client Requirements', () => {
    it('should export memoized createSupabaseClient and db client', async () => {
      const supabaseFile = join(process.cwd(), 'src/lib/supabase.ts')
      const content = await readFile(supabaseFile, 'utf-8')
      
      // Should export createSupabaseClient function
      expect(content).toMatch(/export\s+function\s+createSupabaseClient/)
      
      // Should export db client
      expect(content).toMatch(/export\s+const\s+db\s*=/)
      
      // Should have memoization (clientCache)
      expect(content).toMatch(/clientCache/)
      
      // Should use environment variables correctly
      expect(content).toMatch(/PUBLIC_SUPABASE_URL/)
      expect(content).toMatch(/PUBLIC_SUPABASE_ANON_KEY/)
    })
  })
})

/**
 * Helper function to recursively get all source files
 */
async function getAllSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const fullDir = join(process.cwd(), dir)
  
  try {
    const entries = await readdir(fullDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(fullDir, entry.name)
      
      if (entry.isDirectory()) {
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') continue
        
        const subFiles = await getAllSourceFiles(join(dir, entry.name))
        files.push(...subFiles)
      } else if (entry.isFile()) {
        // Include TypeScript, JavaScript, and Svelte files
        if (entry.name.match(/\.(ts|js|svelte)$/)) {
          files.push(fullPath)
        }
      }
    }
  } catch (error) {
    // Directory might not exist, that's okay
    console.warn(`Could not read directory ${dir}:`, error)
  }
  
  return files
}