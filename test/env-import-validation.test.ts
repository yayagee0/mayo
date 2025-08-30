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
    it('should use proper import.meta.env for Firebase environment variables', async () => {
      const firebaseFile = join(process.cwd(), 'src/lib/firebase.ts')
      const content = await readFile(firebaseFile, 'utf-8')
      
      // Should use import.meta.env for Vite environment variables
      expect(content).toMatch(/import\.meta\.env\.VITE_FB_API_KEY/)
      expect(content).toMatch(/import\.meta\.env\.VITE_FB_AUTH_DOMAIN/)
      expect(content).toMatch(/import\.meta\.env\.VITE_FB_PROJECT_ID/)
      expect(content).toMatch(/import\.meta\.env\.VITE_FB_STORAGE_BUCKET/)
      expect(content).toMatch(/import\.meta\.env\.VITE_FB_APP_ID/)
    })

    it('should use import.meta.env in allowlist configuration', async () => {
      const allowlistFile = join(process.cwd(), 'src/lib/allowlist.ts')
      const content = await readFile(allowlistFile, 'utf-8')
      
      // Should use import.meta.env for family ID
      expect(content).toMatch(/import\.meta\.env\.VITE_FAMILY_ID/)
    })

    it('should properly mock environment variables in test setup', async () => {
      const setupFile = join(process.cwd(), 'test/setup.ts')
      
      try {
        const content = await readFile(setupFile, 'utf-8')
        
        // If setup file exists, should mock Firebase environment variables
        expect(content).toMatch(/VITE_FB_/)
      } catch (error: any) {
        // Setup file might not exist, which is fine for Firebase app
        // Just verify we can test without setup file
        expect(error.code).toBe('ENOENT')
      }
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

  describe('Firebase Client Requirements', () => {
    it('should export Firebase services and helper functions', async () => {
      const firebaseFile = join(process.cwd(), 'src/lib/firebase.ts')
      const content = await readFile(firebaseFile, 'utf-8')
      
      // Should export Firebase services
      expect(content).toMatch(/export\s+const\s+auth\s*=/)
      expect(content).toMatch(/export\s+const\s+db\s*=/)
      expect(content).toMatch(/export\s+const\s+storage\s*=/)
      
      // Should export helper functions
      expect(content).toMatch(/export\s+async\s+function\s+signInWithGoogle/)
      expect(content).toMatch(/export\s+async\s+function\s+createOrUpdateUser/)
      expect(content).toMatch(/export\s+async\s+function\s+uploadFile/)
      
      // Should use Firebase configuration
      expect(content).toMatch(/initializeApp/)
      expect(content).toMatch(/getAuth/)
      expect(content).toMatch(/getFirestore/)
      expect(content).toMatch(/getStorage/)
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