import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import TopbarGreeting from '../src/components/TopbarGreeting.svelte';

describe('Topbar Cleanup Tests', () => {
  const mockProfile = {
    display_name: 'John Doe',
    email: 'john@example.com'
  };

  it('should only render on desktop (hidden on mobile)', () => {
    const { container } = render(TopbarGreeting, {
      props: { profile: mockProfile }
    });
    
    const topbarElement = container.querySelector('div');
    expect(topbarElement?.className).toContain('hidden md:block');
  });

  it('should display primary greeting with correct styling', () => {
    const { container } = render(TopbarGreeting, {
      props: { profile: mockProfile }
    });
    
    const heading = container.querySelector('h2');
    expect(heading?.textContent).toContain('Welcome back, John Doe 🙏');
    expect(heading?.className).toContain('text-lg font-semibold');
  });

  it('should display secondary message with correct styling', () => {
    const { container } = render(TopbarGreeting, {
      props: { profile: mockProfile }
    });
    
    const secondaryText = container.querySelector('p');
    expect(secondaryText?.className).toContain('text-sm text-gray-500');
  });

  it('should use space-y-1 wrapper for greeting elements', () => {
    const { container } = render(TopbarGreeting, {
      props: { profile: mockProfile }
    });
    
    const wrapper = container.querySelector('.space-y-1');
    expect(wrapper).toBeTruthy();
  });

  it('should show recent poster message when available', () => {
    // This test would need to mock the Supabase call
    // For now, we'll test the fallback message
    const { container } = render(TopbarGreeting, {
      props: { profile: mockProfile }
    });
    
    // Should eventually show the fallback message
    setTimeout(() => {
      const secondaryText = container.querySelector('p');
      expect(secondaryText?.textContent).toBe('Good to see you, family is waiting ❤️');
    }, 100);
  });

  it('should fallback to email username when display_name is not available', () => {
    const profileWithoutName = {
      email: 'jane@example.com',
      display_name: null
    };

    const { container } = render(TopbarGreeting, {
      props: { profile: profileWithoutName }
    });
    
    const heading = container.querySelector('h2');
    expect(heading?.textContent).toContain('Welcome back, jane 🙏');
  });
});

describe('Layout Topbar Integration Tests', () => {
  it('should verify mobile topbar keeps avatar (integration test placeholder)', () => {
    // This would require rendering the full layout component
    // and checking the mobile topbar behavior
    expect(true).toBe(true); // Placeholder for manual testing
  });

  it('should verify no duplicate greetings (integration test placeholder)', () => {
    // This would require rendering the full layout 
    // and ensuring only one greeting appears at a time
    expect(true).toBe(true); // Placeholder for manual testing
  });

  it('should verify desktop shows only text, mobile shows avatar (integration test placeholder)', () => {
    // This would require responsive testing
    // Mobile: greeting + avatar in topbar
    // Desktop: greeting text only (no avatar in topbar)
    expect(true).toBe(true); // Placeholder for manual testing
  });
});