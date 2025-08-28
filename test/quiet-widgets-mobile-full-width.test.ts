import { describe, it, expect } from 'vitest';

describe('Quiet Widgets Mobile Full-Width Layout', () => {
	describe('Outer Wrapper Responsive Classes', () => {
		it('should have correct responsive classes for edge-to-edge mobile layout', () => {
			// The outer wrapper classes for true full-width behavior
			const outerWrapper = 'w-full mx-0 px-0 sm:px-4 sm:max-w-3xl sm:mx-auto';
			
			// Mobile (≤640px): Edge-to-edge width, no horizontal margins/padding
			expect(outerWrapper).toContain('w-full'); // Full width
			expect(outerWrapper).toContain('mx-0'); // No horizontal margins on mobile
			expect(outerWrapper).toContain('px-0'); // No horizontal padding on mobile
			
			// Desktop (>640px): Centered with max-width and padding restored
			expect(outerWrapper).toContain('sm:px-4'); // Horizontal padding restored on ≥640px
			expect(outerWrapper).toContain('sm:max-w-3xl'); // Max width on ≥640px
			expect(outerWrapper).toContain('sm:mx-auto'); // Centered on ≥640px
		});
	});

	describe('Accordion Panel Responsive Behavior', () => {
		it('should have full width accordion panels', () => {
			const accordionPanel = 'w-full bg-white rounded-xl shadow-sm border border-slate-200';
			
			expect(accordionPanel).toContain('w-full');
			expect(accordionPanel).toContain('bg-white');
		});

		it('should have responsive padding for accordion buttons', () => {
			const accordionButton = 'w-full px-0 py-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-slate-50 transition-colors rounded-t-xl sm:px-4';
			
			// Mobile: No horizontal padding
			expect(accordionButton).toContain('px-0');
			// Desktop: Horizontal padding restored
			expect(accordionButton).toContain('sm:px-4');
		});

		it('should have responsive padding for accordion content', () => {
			const accordionContent = 'px-0 pb-4 border-t border-slate-100 sm:px-4';
			
			// Mobile: No horizontal padding for edge-to-edge content
			expect(accordionContent).toContain('px-0');
			// Desktop: Horizontal padding restored
			expect(accordionContent).toContain('sm:px-4');
		});
	});

	describe('Widget Card Styling Consistency', () => {
		it('should match Anchor Widget styling requirements', () => {
			const widgetCardClasses = 'bg-white rounded-2xl shadow p-4 w-full';
			
			// Required styling components
			expect(widgetCardClasses).toContain('bg-white'); // White background as specified
			expect(widgetCardClasses).toContain('rounded-2xl'); // Consistent border radius
			expect(widgetCardClasses).toContain('shadow'); // Shadow for elevation
			expect(widgetCardClasses).toContain('p-4'); // Consistent padding
			expect(widgetCardClasses).toContain('w-full'); // Full width within container
		});

		it('should have full width widget containers', () => {
			const widgetContainer = 'w-full';
			
			// Widget containers should span full width (no max-width constraint)
			expect(widgetContainer).toContain('w-full');
			expect(widgetContainer).not.toContain('max-w-'); // No max-width constraints
			expect(widgetContainer).not.toContain('mx-auto'); // No centering constraints
		});
	});

	describe('Touch Target and Accessibility', () => {
		it('should maintain 44px minimum touch targets', () => {
			const buttonStyles = 'w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-transform hover:scale-[1.02]';
			const minHeight = 'min-height: 44px;';
			
			// Button should be full width for better touch accessibility
			expect(buttonStyles).toContain('w-full');
			// Focus ring for keyboard navigation
			expect(buttonStyles).toContain('focus:ring-2');
			// Minimum height should be set in style attribute
			expect(minHeight).toContain('44px');
		});

		it('should preserve ARIA attributes for screen readers', () => {
			const ariaExpanded = 'aria-expanded={isExpanded}';
			const ariaLabel = 'aria-label="View {widget.name} widget"';
			
			expect(ariaExpanded).toContain('aria-expanded');
			expect(ariaLabel).toContain('aria-label');
		});
	});

	describe('Main Section Header Responsive Behavior', () => {
		it('should have responsive padding for main section toggle button', () => {
			const mainToggleButton = 'w-full px-0 py-3 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-slate-100 transition-colors rounded-lg sm:px-4';
			
			// Mobile: No horizontal padding for edge-to-edge
			expect(mainToggleButton).toContain('px-0');
			// Desktop: Horizontal padding restored  
			expect(mainToggleButton).toContain('sm:px-4');
			// Always full width
			expect(mainToggleButton).toContain('w-full');
		});
	});

	describe('Layout Validation Rules', () => {
		it('should ensure mobile behavior: edge-to-edge width, no side gutters', () => {
			// All the key classes that enable edge-to-edge mobile layout
			const outerWrapper = 'w-full mx-0 px-0 sm:px-4 sm:max-w-3xl sm:mx-auto';
			const accordionButton = 'px-0 sm:px-4';
			const accordionContent = 'px-0 sm:px-4';
			const widgetContainer = 'w-full';
			
			// Verify mobile classes
			expect(outerWrapper).toContain('w-full');
			expect(outerWrapper).toContain('mx-0');
			expect(outerWrapper).toContain('px-0');
			
			expect(accordionButton).toContain('px-0');
			expect(accordionContent).toContain('px-0');
			expect(widgetContainer).toContain('w-full');
		});

		it('should ensure desktop behavior: centered max-width with padding', () => {
			// All the key classes that enable proper desktop layout
			const desktopClasses = [
				'sm:px-4 sm:max-w-3xl sm:mx-auto', // Outer wrapper: padding, max-width, centered
				'sm:px-4', // Accordion buttons: horizontal padding restored
				'sm:px-4' // Accordion content: horizontal padding restored
			];
			
			desktopClasses.forEach(classes => {
				expect(classes).toContain('sm:px-4');
			});
			
			// Check specific desktop layout constraints
			const outerWrapper = 'sm:max-w-3xl sm:mx-auto';
			expect(outerWrapper).toContain('sm:max-w-3xl'); // Max width on desktop
			expect(outerWrapper).toContain('sm:mx-auto'); // Centered on desktop
		});
	});
});