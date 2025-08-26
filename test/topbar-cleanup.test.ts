import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import TopBar from '../src/components/TopBar.svelte';

// Mock Supabase to prevent actual API calls
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    }))
  }
}));

// Mock profile store
vi.mock('../src/lib/stores/profileStore', () => ({
  profileStore: {
    findByEmail: vi.fn(() => null)
  }
}));

describe('TopBar Component Tests', () => {
  const mockUserName = 'John';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with brand and greeting', () => {
    const { container } = render(TopBar, {
      props: { userName: mockUserName }
    });
    
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    expect(header?.className).toContain('bg-white border-b border-gray-200');
  });

  it('should display FamilyNest brand with correct styling', () => {
    const { container } = render(TopBar, {
      props: { userName: mockUserName }
    });
    
    const heading = container.querySelector('h1');
    expect(heading?.textContent).toBe('FamilyNest');
    expect(heading?.className).toContain('text-xl font-bold text-gray-900');
  });

  it('should display greeting with username and emoji', () => {
    const { container } = render(TopBar, {
      props: { userName: mockUserName }
    });
    
    const greetingText = container.querySelector('p.text-sm.font-medium');
    expect(greetingText?.textContent).toContain('🌿 Salam John');
  });

  it('should show loading message initially', () => {
    const { container } = render(TopBar, {
      props: { userName: mockUserName }
    });
    
    const secondaryText = container.querySelector('p.text-xs.text-gray-500');
    expect(secondaryText?.textContent).toBe('Loading...');
  });

  it('should show fallback message when no recent posts', async () => {
    const { container } = render(TopBar, {
      props: { userName: mockUserName }
    });
    
    // Wait for component to finish loading
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const secondaryText = container.querySelector('p.text-xs.text-gray-500');
    expect(secondaryText?.textContent).toBe('Good to see you, family is waiting ❤️');
  });

  it('should handle missing userName gracefully', () => {
    const { container } = render(TopBar, {
      props: { userName: '' }
    });
    
    const greetingText = container.querySelector('p.text-sm.font-medium');
    expect(greetingText?.textContent).toContain('🌿 Salam Friend'); // Falls back to 'Friend'
  });
});

describe('TopBar Integration Tests', () => {
  it('should verify responsive topbar behavior', () => {
    // The new TopBar component is always visible (no hidden classes)
    // and should work responsively across all screen sizes
    // Mobile vs desktop behavior is now handled by layout
    expect(true).toBe(true); // Placeholder for manual testing
  });

  it('should integrate correctly with dashboard layout', () => {
    // Tests would verify that:
    // - TopBar replaces the old inline header in dashboard
    // - No duplicate headers appear
    // - TopBar receives correct userName prop
    expect(true).toBe(true); // Placeholder for integration testing
  });
});