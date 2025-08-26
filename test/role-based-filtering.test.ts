import { describe, it, expect } from 'vitest';
import { getUserRole } from '../src/lib/utils/roles';

describe('Role-Based Widget Filtering', () => {
	// Mock the shouldShowWidget function logic from dashboard
	function shouldShowWidget(widgetId: string, userEmail: string): boolean {
		const role = getUserRole(userEmail);
		
		// Parent-only widgets
		if (['weeklyReflectionDigest', 'analytics', 'islamicReflectionDigest', 'scenarioDigest'].includes(widgetId)) {
			return role === 'parent';
		}
		
		// Children-only widgets  
		if (['islamicQA', 'scenario'].includes(widgetId)) {
			return role === 'child';
		}
		
		// All other widgets are visible to everyone
		return true;
	}

	describe('Parent-Only Widget Visibility', () => {
		const parentOnlyWidgets = ['weeklyReflectionDigest', 'analytics', 'islamicReflectionDigest', 'scenarioDigest'];
		const parentEmails = ['nilezat@gmail.com', 'abdessamia.mariem@gmail.com'];
		const childEmails = ['yazidgeemail@gmail.com', 'yahyageemail@gmail.com'];

		it('should show parent-only widgets to parents', () => {
			parentEmails.forEach(email => {
				parentOnlyWidgets.forEach(widgetId => {
					expect(shouldShowWidget(widgetId, email)).toBe(true);
				});
			});
		});

		it('should hide parent-only widgets from children', () => {
			childEmails.forEach(email => {
				parentOnlyWidgets.forEach(widgetId => {
					expect(shouldShowWidget(widgetId, email)).toBe(false);
				});
			});
		});
	});

	describe('Child-Only Widget Visibility', () => {
		const childOnlyWidgets = ['islamicQA', 'scenario'];
		const parentEmails = ['nilezat@gmail.com', 'abdessamia.mariem@gmail.com'];
		const childEmails = ['yazidgeemail@gmail.com', 'yahyageemail@gmail.com'];

		it('should show child-only widgets to children', () => {
			childEmails.forEach(email => {
				childOnlyWidgets.forEach(widgetId => {
					expect(shouldShowWidget(widgetId, email)).toBe(true);
				});
			});
		});

		it('should hide child-only widgets from parents', () => {
			parentEmails.forEach(email => {
				childOnlyWidgets.forEach(widgetId => {
					expect(shouldShowWidget(widgetId, email)).toBe(false);
				});
			});
		});
	});

	describe('Universal Widget Visibility', () => {
		const universalWidgets = ['reflectionMood', 'ayah', 'birthday', 'wall', 'quiz', 'professionCard', 'agePlayground'];
		const allEmails = ['nilezat@gmail.com', 'abdessamia.mariem@gmail.com', 'yazidgeemail@gmail.com', 'yahyageemail@gmail.com'];

		it('should show universal widgets to all users', () => {
			allEmails.forEach(email => {
				universalWidgets.forEach(widgetId => {
					expect(shouldShowWidget(widgetId, email)).toBe(true);
				});
			});
		});
	});

	describe('Widget Visibility Matrix', () => {
		it('should properly enforce all visibility rules', () => {
			const testCases = [
				// Parents should see parent-only widgets
				{ email: 'nilezat@gmail.com', widget: 'weeklyReflectionDigest', expected: true },
				{ email: 'abdessamia.mariem@gmail.com', widget: 'analytics', expected: true },
				
				// Parents should NOT see child-only widgets
				{ email: 'nilezat@gmail.com', widget: 'islamicQA', expected: false },
				{ email: 'abdessamia.mariem@gmail.com', widget: 'scenario', expected: false },
				
				// Children should see child-only widgets
				{ email: 'yazidgeemail@gmail.com', widget: 'islamicQA', expected: true },
				{ email: 'yahyageemail@gmail.com', widget: 'scenario', expected: true },
				
				// Children should NOT see parent-only widgets
				{ email: 'yazidgeemail@gmail.com', widget: 'analytics', expected: false },
				{ email: 'yahyageemail@gmail.com', widget: 'weeklyReflectionDigest', expected: false },
				
				// Everyone should see universal widgets
				{ email: 'nilezat@gmail.com', widget: 'quiz', expected: true },
				{ email: 'yazidgeemail@gmail.com', widget: 'ayah', expected: true },
				{ email: 'abdessamia.mariem@gmail.com', widget: 'wall', expected: true },
				{ email: 'yahyageemail@gmail.com', widget: 'professionCard', expected: true }
			];

			testCases.forEach(({ email, widget, expected }) => {
				expect(shouldShowWidget(widget, email)).toBe(expected);
			});
		});
	});
});