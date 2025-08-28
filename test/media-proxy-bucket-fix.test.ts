import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Media Proxy Bucket Prefix Fix', () => {
  describe('Bucket prefix stripping logic', () => {
    it('should contain logic to strip duplicate bucket prefixes', () => {
      const proxyRoutePath = join(process.cwd(), 'src/routes/api/media/[...path]/+server.ts')
      const proxyRouteContent = readFileSync(proxyRoutePath, 'utf-8')
      
      // Should contain the fix for stripping bucket prefix
      expect(proxyRouteContent).toContain('Handle duplicate bucket prefix')
      expect(proxyRouteContent).toContain('filePath.startsWith(bucket + \'/\')')
      expect(proxyRouteContent).toContain('filePath.slice(bucket.length + 1)')
    })

    it('should log when duplicate prefix is detected and fixed', () => {
      const proxyRoutePath = join(process.cwd(), 'src/routes/api/media/[...path]/+server.ts')
      const proxyRouteContent = readFileSync(proxyRoutePath, 'utf-8')
      
      // Should log debug information when fixing paths
      expect(proxyRouteContent).toContain('console.debug')
      expect(proxyRouteContent).toContain('stripped duplicate prefix')
      expect(proxyRouteContent).toContain('Proxying media')
    })

    it('should handle normal paths without modification', () => {
      const proxyRoutePath = join(process.cwd(), 'src/routes/api/media/[...path]/+server.ts')
      const proxyRouteContent = readFileSync(proxyRoutePath, 'utf-8')
      
      // Should only modify filePath when duplication is detected
      expect(proxyRouteContent).toContain('if (filePath.startsWith(bucket + \'/\'))')
      
      // The fix should be conditional, not always applied
      expect(proxyRouteContent).toMatch(/if\s*\(\s*filePath\.startsWith\(bucket\s*\+\s*['"`]\/['"`]\)\s*\)\s*\{/)
    })

    it('should preserve the original path parsing logic structure', () => {
      const proxyRoutePath = join(process.cwd(), 'src/routes/api/media/[...path]/+server.ts')
      const proxyRouteContent = readFileSync(proxyRoutePath, 'utf-8')
      
      // Path parsing logic (updated for new structure)
      expect(proxyRouteContent).toContain('params.path.split(\'/\').filter(Boolean)')
      expect(proxyRouteContent).toContain('const bucket = parts.shift()')
      expect(proxyRouteContent).toContain('let filePath = parts.join(\'/\')')
      
      // Validation should still be present
      expect(proxyRouteContent).toContain('if (!bucket)')
      expect(proxyRouteContent).toContain('Missing bucket')
    })
  })

  describe('Path handling scenarios', () => {
    // Simulate the path parsing logic to test different scenarios
    function simulatePathParsing(mediaPath: string) {
      const parts = mediaPath.split('/').filter(Boolean)
      const bucket = parts.shift() || ''
      if (!bucket) {
        return { error: 'Missing bucket' }
      }

      let filePath = parts.join('/')
      
      // Apply the fix logic
      if (filePath.startsWith(bucket + '/')) {
        filePath = filePath.slice(bucket.length + 1)
      }
      
      return { bucket, filePath }
    }

    it('should handle normal paths correctly', () => {
      const result = simulatePathParsing('post-media/avatars/user-avatar.jpg')
      expect(result).toEqual({
        bucket: 'post-media',
        filePath: 'avatars/user-avatar.jpg'
      })
    })

    it('should fix paths with duplicate bucket prefix', () => {
      const result = simulatePathParsing('post-media/post-media/avatars/user-avatar.jpg')
      expect(result).toEqual({
        bucket: 'post-media',
        filePath: 'avatars/user-avatar.jpg'
      })
    })

    it('should handle simple file names', () => {
      const result = simulatePathParsing('post-media/file.jpg')
      expect(result).toEqual({
        bucket: 'post-media',
        filePath: 'file.jpg'
      })
    })

    it('should fix simple files with duplicate prefix', () => {
      const result = simulatePathParsing('post-media/post-media/file.jpg')
      expect(result).toEqual({
        bucket: 'post-media',
        filePath: 'file.jpg'
      })
    })

    it('should handle nested paths correctly', () => {
      const result = simulatePathParsing('post-media/uploads/2024/01/image.jpg')
      expect(result).toEqual({
        bucket: 'post-media',
        filePath: 'uploads/2024/01/image.jpg'
      })
    })

    it('should fix nested paths with duplicate prefix', () => {
      const result = simulatePathParsing('post-media/post-media/uploads/2024/01/image.jpg')
      expect(result).toEqual({
        bucket: 'post-media',
        filePath: 'uploads/2024/01/image.jpg'
      })
    })

    it('should not modify paths that partially match bucket name', () => {
      // If file path happens to start with part of bucket name but not exact match
      const result = simulatePathParsing('post-media/post-something/file.jpg')
      expect(result).toEqual({
        bucket: 'post-media',
        filePath: 'post-something/file.jpg'
      })
    })
  })
})