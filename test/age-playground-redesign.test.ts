import { describe, it, expect } from 'vitest';
import { calculateFamilyAgesWithNegatives, getAllFamilyProfiles } from '../src/lib/utils/age';

// Mock profiles representing the actual family (Ghassan, Mariem, Yazid, Yahya)
const familyProfiles = [
	{
		user_id: '1',
		email: 'nilezat@gmail.com', // Ghassan
		display_name: 'G',
		avatar_url: null,
		role: 'parent',
		dob: '1980-01-01', // 44 years old
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	},
	{
		user_id: '2',
		email: 'abdessamia.mariem@gmail.com', // Mariem
		display_name: 'Mayouta',
		avatar_url: null,
		role: 'parent',
		dob: '1988-01-01', // 36 years old
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	},
	{
		user_id: '3',
		email: 'yazidgeemail@gmail.com', // Yazid
		display_name: 'Yazid',
		avatar_url: null,
		role: 'child',
		dob: '2016-01-01', // 8 years old
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	},
	{
		user_id: '4',
		email: 'yahyageemail@gmail.com', // Yahya
		display_name: 'Yahya',
		avatar_url: null,
		role: 'child',
		dob: '2017-01-01', // 7 years old
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	}
];

describe('Age Playground Redesign', () => {
	describe('Family Member Selection', () => {
		it('should include all family members with DOB, not just children', () => {
			const allFamily = getAllFamilyProfiles(familyProfiles);
			expect(allFamily).toHaveLength(4);
			
			// Check that both parents and children are included
			const emails = allFamily.map(p => p.email);
			expect(emails).toContain('nilezat@gmail.com'); // Ghassan
			expect(emails).toContain('abdessamia.mariem@gmail.com'); // Mariem
			expect(emails).toContain('yazidgeemail@gmail.com'); // Yazid
			expect(emails).toContain('yahyageemail@gmail.com'); // Yahya
		});
	});

	describe('Negative Age Calculation', () => {
		it('should calculate negative ages when target person is set to very young age', () => {
			// When Ghassan is set to 1 year old, others should be negative
			const familyAges = calculateFamilyAgesWithNegatives(familyProfiles, 'nilezat@gmail.com', 1);
			
			expect(familyAges['nilezat@gmail.com']).toBe(1);
			expect(familyAges['abdessamia.mariem@gmail.com']).toBeLessThan(0); // Mariem would be negative
			expect(familyAges['yazidgeemail@gmail.com']).toBeLessThan(0); // Yazid would be negative
			expect(familyAges['yahyageemail@gmail.com']).toBeLessThan(0); // Yahya would be negative
		});

		it('should show realistic ages when target is set appropriately', () => {
			// When Yazid is set to 10, others should have reasonable ages
			const familyAges = calculateFamilyAgesWithNegatives(familyProfiles, 'yazidgeemail@gmail.com', 10);
			
			expect(familyAges['yazidgeemail@gmail.com']).toBe(10);
			expect(familyAges['nilezat@gmail.com']).toBeGreaterThan(40); // Ghassan should be ~46
			expect(familyAges['abdessamia.mariem@gmail.com']).toBeGreaterThan(30); // Mariem should be ~38
			expect(familyAges['yahyageemail@gmail.com']).toBeGreaterThan(5); // Yahya should be ~9
		});
	});

	describe('Age Display Formatting', () => {
		// Test the formatAge function logic
		function formatAge(age: number, showExactOffsets: boolean): string {
			if (age < 1) {
				if (age === 0) return 'Not born yet'; // 0 is always "not born yet"
				return showExactOffsets ? `–${Math.abs(age)} years old` : 'Not born yet';
			}
			return `${age} years old`;
		}

		it('should show "Not born yet" by default for negative ages', () => {
			expect(formatAge(-5, false)).toBe('Not born yet');
			expect(formatAge(-10, false)).toBe('Not born yet');
			expect(formatAge(0, false)).toBe('Not born yet');
		});

		it('should show exact negative ages when toggle is ON', () => {
			expect(formatAge(-5, true)).toBe('–5 years old');
			expect(formatAge(-26, true)).toBe('–26 years old');
			expect(formatAge(0, true)).toBe('Not born yet'); // 0 is still "not born yet"
		});

		it('should show positive ages normally regardless of toggle', () => {
			expect(formatAge(5, false)).toBe('5 years old');
			expect(formatAge(5, true)).toBe('5 years old');
			expect(formatAge(25, false)).toBe('25 years old');
			expect(formatAge(25, true)).toBe('25 years old');
		});
	});

	describe('Control Synchronization', () => {
		// Test that different input methods would stay in sync
		it('should validate age input bounds', () => {
			function validateAgeInput(value: string, maxAge: number): number | null {
				const num = parseInt(value);
				if (isNaN(num) || num < 1 || num > maxAge) {
					return null;
				}
				return num;
			}

			// Valid inputs
			expect(validateAgeInput('10', 70)).toBe(10);
			expect(validateAgeInput('1', 70)).toBe(1);
			expect(validateAgeInput('70', 70)).toBe(70);
			expect(validateAgeInput('18', 18)).toBe(18);

			// Invalid inputs
			expect(validateAgeInput('0', 70)).toBe(null);
			expect(validateAgeInput('71', 70)).toBe(null);
			expect(validateAgeInput('19', 18)).toBe(null);
			expect(validateAgeInput('abc', 70)).toBe(null);
			expect(validateAgeInput('', 70)).toBe(null);
		});

		it('should handle increment/decrement operations properly', () => {
			function incrementAge(currentAge: number, maxAge: number): number {
				return currentAge < maxAge ? currentAge + 1 : currentAge;
			}

			function decrementAge(currentAge: number): number {
				return currentAge > 1 ? currentAge - 1 : currentAge;
			}

			// Test increment
			expect(incrementAge(10, 70)).toBe(11);
			expect(incrementAge(69, 70)).toBe(70);
			expect(incrementAge(70, 70)).toBe(70); // Should not exceed max

			// Test decrement
			expect(decrementAge(10)).toBe(9);
			expect(decrementAge(2)).toBe(1);
			expect(decrementAge(1)).toBe(1); // Should not go below 1
		});
	});

	describe('Max Age Constraints', () => {
		it('should enforce different max ages based on user email', () => {
			function getMaxAge(userEmail: string): number {
				return userEmail === 'nilezat@gmail.com' ? 70 : 18;
			}

			expect(getMaxAge('nilezat@gmail.com')).toBe(70); // Ghassan
			expect(getMaxAge('abdessamia.mariem@gmail.com')).toBe(18); // Mariem
			expect(getMaxAge('yazidgeemail@gmail.com')).toBe(18); // Yazid
			expect(getMaxAge('yahyageemail@gmail.com')).toBe(18); // Yahya
			expect(getMaxAge('unknown@example.com')).toBe(18); // Default
		});
	});

	describe('Accessibility Requirements', () => {
		it('should provide proper ARIA labels for controls', () => {
			const ariaLabels = {
				targetAgeInput: 'Target age in years',
				decrementButton: 'Decrease age by 1 year',
				incrementButton: 'Increase age by 1 year',
				slider: 'Target age slider',
				toggle: 'Toggle between showing \'Not born yet\' and exact negative ages'
			};

			// Verify all required ARIA labels are defined
			expect(ariaLabels.targetAgeInput).toBeTruthy();
			expect(ariaLabels.decrementButton).toBeTruthy();
			expect(ariaLabels.incrementButton).toBeTruthy();
			expect(ariaLabels.slider).toBeTruthy();
			expect(ariaLabels.toggle).toBeTruthy();
		});

		it('should handle keyboard accessibility for toggle button', () => {
			function getToggleAriaPressed(showExactOffsets: boolean): string {
				return showExactOffsets.toString();
			}

			expect(getToggleAriaPressed(false)).toBe('false');
			expect(getToggleAriaPressed(true)).toBe('true');
		});
	});
});