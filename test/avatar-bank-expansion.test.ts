import { describe, it, expect } from 'vitest';
import { avatarBank } from '../src/lib/avatarBank';

describe('Avatar Bank Tests', () => {
  it('should have expanded avatar bank with 17 avatars', () => {
    expect(avatarBank).toHaveLength(17);
    expect(avatarBank).toContain('/avatars/avatar-7.svg');
    expect(avatarBank).toContain('/avatars/avatar-17.svg');
  });

  it('should have correct file paths for all avatars', () => {
    avatarBank.forEach((avatar, index) => {
      expect(avatar).toBe(`/avatars/avatar-${index + 1}.svg`);
    });
  });

  it('should include new avatar types', () => {
    // Young boys (7, 11 years old) - avatars 7-9
    expect(avatarBank).toContain('/avatars/avatar-7.svg');
    expect(avatarBank).toContain('/avatars/avatar-8.svg');
    expect(avatarBank).toContain('/avatars/avatar-9.svg');
    
    // Women (mid-30s) - avatars 10-12
    expect(avatarBank).toContain('/avatars/avatar-10.svg');
    expect(avatarBank).toContain('/avatars/avatar-11.svg');
    expect(avatarBank).toContain('/avatars/avatar-12.svg');
    
    // Men (early 40s) - avatars 13-15
    expect(avatarBank).toContain('/avatars/avatar-13.svg');
    expect(avatarBank).toContain('/avatars/avatar-14.svg');
    expect(avatarBank).toContain('/avatars/avatar-15.svg');
    
    // Fun/exaggerated styles - avatars 16-17
    expect(avatarBank).toContain('/avatars/avatar-16.svg');
    expect(avatarBank).toContain('/avatars/avatar-17.svg');
  });

  it('should maintain backwards compatibility with original avatars', () => {
    // Original 6 avatars should still be present
    expect(avatarBank).toContain('/avatars/avatar-1.svg');
    expect(avatarBank).toContain('/avatars/avatar-2.svg');
    expect(avatarBank).toContain('/avatars/avatar-3.svg');
    expect(avatarBank).toContain('/avatars/avatar-4.svg');
    expect(avatarBank).toContain('/avatars/avatar-5.svg');
    expect(avatarBank).toContain('/avatars/avatar-6.svg');
  });

  it('should support avatar bank functions with expanded set', async () => {
    const { getRandomAvatar, getAvatarByIndex, getDefaultAvatarForUser } = 
      await import('../src/lib/avatarBank');
    
    // Test getRandomAvatar returns valid avatar
    const randomAvatar = getRandomAvatar();
    expect(avatarBank).toContain(randomAvatar);
    
    // Test getAvatarByIndex with new range
    const firstAvatar = getAvatarByIndex(0);
    expect(firstAvatar).toBe('/avatars/avatar-1.svg');
    
    const lastAvatar = getAvatarByIndex(16);
    expect(lastAvatar).toBe('/avatars/avatar-17.svg');
    
    // Test cycling behavior
    const cycledAvatar = getAvatarByIndex(17);
    expect(cycledAvatar).toBe('/avatars/avatar-1.svg');
    
    // Test getDefaultAvatarForUser returns valid avatar
    const defaultAvatar = getDefaultAvatarForUser('test@example.com');
    expect(avatarBank).toContain(defaultAvatar);
  });
});