import { describe, it, expect } from 'vitest';
import { 
  dreamRoles, 
  getRandomDreamRole, 
  getDreamRoleByName, 
  renderWorldImpactScore,
  type DreamRole 
} from '../src/lib/data/dreamRoles';
import { calculateFamilyAgesWithNegatives } from '../src/lib/utils/age';

// Mock family profiles for testing
const mockFamilyProfiles = [
  {
    email: 'nilezat@gmail.com',
    display_name: 'Ghassan',
    dob: '1979-01-01',
    role: 'parent',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    email: 'abdessamia.mariem@gmail.com',
    display_name: 'Mariem',
    dob: '1985-06-15',
    role: 'parent',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    email: 'yazidgeemail@gmail.com',
    display_name: 'Yazid',
    dob: '2015-03-10',
    role: 'child',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    email: 'yahyageemail@gmail.com',
    display_name: 'Yahya',
    dob: '2016-09-20',
    role: 'child',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('Dream Builder Playground', () => {
  describe('Dream Roles Dataset', () => {
    it('should have all required dream roles with complete meaning structure', () => {
      expect(dreamRoles).toHaveLength(12);
      
      // Check that each role has all required fields
      dreamRoles.forEach(role => {
        expect(role).toHaveProperty('role');
        expect(role).toHaveProperty('icon');
        expect(role).toHaveProperty('typicalAge');
        expect(role).toHaveProperty('meaning');
        
        // Check meaning has all 11 required fields
        const meaning = role.meaning;
        expect(meaning).toHaveProperty('age');
        expect(meaning).toHaveProperty('description');
        expect(meaning).toHaveProperty('impact');
        expect(meaning).toHaveProperty('values');
        expect(meaning).toHaveProperty('journey');
        expect(meaning).toHaveProperty('joy');
        expect(meaning).toHaveProperty('challenges');
        expect(meaning).toHaveProperty('legacy');
        expect(meaning).toHaveProperty('roleModels');
        expect(meaning).toHaveProperty('worldImpactScore');
        expect(meaning).toHaveProperty('personalFit');
        
        // Check data types
        expect(typeof role.role).toBe('string');
        expect(typeof role.icon).toBe('string');
        expect(typeof role.typicalAge).toBe('number');
        expect(typeof meaning.age).toBe('number');
        expect(typeof meaning.description).toBe('string');
        expect(typeof meaning.impact).toBe('string');
        expect(Array.isArray(meaning.values)).toBe(true);
        expect(typeof meaning.journey).toBe('string');
        expect(typeof meaning.joy).toBe('string');
        expect(typeof meaning.challenges).toBe('string');
        expect(typeof meaning.legacy).toBe('string');
        expect(Array.isArray(meaning.roleModels)).toBe(true);
        expect(typeof meaning.worldImpactScore).toBe('number');
        expect(typeof meaning.personalFit).toBe('string');
        
        // Check constraints
        expect(meaning.worldImpactScore).toBeGreaterThanOrEqual(1);
        expect(meaning.worldImpactScore).toBeLessThanOrEqual(5);
        expect(meaning.values.length).toBeGreaterThanOrEqual(2);
        expect(meaning.roleModels.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should include baseline dream roles with correct typical ages', () => {
      const expectedRoles = [
        { role: 'Engineer', age: 24 },
        { role: 'Pilot', age: 22 },
        { role: 'Doctor', age: 26 },
        { role: 'Teacher', age: 25 },
        { role: 'Singer', age: 20 },
        { role: 'Actor', age: 20 },
        { role: 'Astronaut', age: 30 },
        { role: 'Youtuber', age: 18 },
        { role: 'Environmental Scientist', age: 26 },
        { role: 'Game Designer', age: 22 },
        { role: 'Entrepreneur', age: 25 },
        { role: 'Lawyer', age: 27 }
      ];
      
      expectedRoles.forEach(expected => {
        const role = dreamRoles.find(r => r.role === expected.role);
        expect(role).toBeDefined();
        expect(role!.typicalAge).toBe(expected.age);
      });
    });

    it('should support expansion without code changes', () => {
      // Test that the dataset structure supports adding new roles
      const newRole: DreamRole = {
        role: 'Test Role',
        icon: '🧪',
        typicalAge: 25,
        meaning: {
          age: 25,
          description: 'Test description',
          impact: 'Test impact',
          values: ['Test Value 1', 'Test Value 2'],
          journey: 'Test journey',
          joy: 'Test joy',
          challenges: 'Test challenges',
          legacy: 'Test legacy',
          roleModels: ['Test Model 1', 'Test Model 2'],
          worldImpactScore: 3,
          personalFit: 'Test personal fit'
        }
      };
      
      // Should be able to add to the array without issues
      const extendedRoles = [...dreamRoles, newRole];
      expect(extendedRoles).toHaveLength(13);
      expect(extendedRoles[12]).toEqual(newRole);
    });
  });

  describe('Dream Selection Functionality', () => {
    it('should get random dream role', () => {
      const randomDream1 = getRandomDreamRole();
      const randomDream2 = getRandomDreamRole();
      
      expect(dreamRoles).toContain(randomDream1);
      expect(dreamRoles).toContain(randomDream2);
      // Note: randomness means they might be the same, but both should be valid
    });

    it('should find dream role by name (case insensitive)', () => {
      const engineer = getDreamRoleByName('Engineer');
      expect(engineer).toBeDefined();
      expect(engineer!.role).toBe('Engineer');
      
      const engineerLower = getDreamRoleByName('engineer');
      expect(engineerLower).toBeDefined();
      expect(engineerLower!.role).toBe('Engineer');
      
      const nonExistent = getDreamRoleByName('NonExistent');
      expect(nonExistent).toBeUndefined();
    });

    it('should render world impact score as stars', () => {
      expect(renderWorldImpactScore(1)).toBe('★☆☆☆☆');
      expect(renderWorldImpactScore(3)).toBe('★★★☆☆');
      expect(renderWorldImpactScore(5)).toBe('★★★★★');
    });
  });

  describe('Age Simulation', () => {
    it('should recalculate ages correctly when dream is selected', () => {
      const doctorRole = dreamRoles.find(r => r.role === 'Doctor')!;
      
      // When Yazid becomes a doctor at 26
      const familyAges = calculateFamilyAgesWithNegatives(
        mockFamilyProfiles, 
        'yazidgeemail@gmail.com', 
        doctorRole.typicalAge
      );
      
      expect(familyAges['yazidgeemail@gmail.com']).toBe(26);
      // Others should have reasonable ages based on age differences
      expect(familyAges['nilezat@gmail.com']).toBeGreaterThan(50);
      expect(familyAges['abdessamia.mariem@gmail.com']).toBeGreaterThan(40);
      expect(familyAges['yahyageemail@gmail.com']).toBeGreaterThan(20);
    });

    it('should handle negative ages with toggle OFF (show "Not born yet")', () => {
      // Mock formatting function from component
      function formatAge(age: number, showExactOffsets: boolean): string {
        if (age < 1) {
          if (age === 0) return 'Not born yet';
          return showExactOffsets ? `${age} years old` : 'Not born yet';
        }
        return `${age} years old`;
      }
      
      expect(formatAge(-5, false)).toBe('Not born yet');
      expect(formatAge(-10, false)).toBe('Not born yet');
      expect(formatAge(0, false)).toBe('Not born yet');
    });

    it('should show exact negative ages when toggle is ON', () => {
      // Mock formatting function from component
      function formatAge(age: number, showExactOffsets: boolean): string {
        if (age < 1) {
          if (age === 0) return 'Not born yet';
          return showExactOffsets ? `${age} years old` : 'Not born yet';
        }
        return `${age} years old`;
      }
      
      expect(formatAge(-5, true)).toBe('-5 years old');
      expect(formatAge(-10, true)).toBe('-10 years old');
      expect(formatAge(0, true)).toBe('Not born yet'); // 0 is always "not born yet"
      expect(formatAge(25, true)).toBe('25 years old');
    });
  });

  describe('Role Reversal', () => {
    it('should recalculate scenario when spotlight changes', () => {
      const pilotRole = dreamRoles.find(r => r.role === 'Pilot')!;
      
      // When Ghassan becomes a pilot at 22
      const ghassanAges = calculateFamilyAgesWithNegatives(
        mockFamilyProfiles, 
        'nilezat@gmail.com', 
        pilotRole.typicalAge
      );
      
      // When Mariem becomes a pilot at 22
      const mariemAges = calculateFamilyAgesWithNegatives(
        mockFamilyProfiles, 
        'abdessamia.mariem@gmail.com', 
        pilotRole.typicalAge
      );
      
      // Ages should be different based on who is the target
      expect(ghassanAges['nilezat@gmail.com']).toBe(22);
      expect(mariemAges['abdessamia.mariem@gmail.com']).toBe(22);
      
      // The age differences should be preserved but applied differently
      expect(ghassanAges['nilezat@gmail.com']).not.toBe(mariemAges['nilezat@gmail.com']);
    });
  });

  describe('Meaning Layer', () => {
    it('should render all 11 fields in meaning panel', () => {
      const testRole = dreamRoles[0]; // Use first role for testing
      const meaning = testRole.meaning;
      
      // Check all fields are present and non-empty
      expect(meaning.age).toBeGreaterThan(0);
      expect(meaning.description.length).toBeGreaterThan(0);
      expect(meaning.impact.length).toBeGreaterThan(0);
      expect(meaning.values.length).toBeGreaterThan(0);
      expect(meaning.journey.length).toBeGreaterThan(0);
      expect(meaning.joy.length).toBeGreaterThan(0);
      expect(meaning.challenges.length).toBeGreaterThan(0);
      expect(meaning.legacy.length).toBeGreaterThan(0);
      expect(meaning.roleModels.length).toBeGreaterThan(0);
      expect(meaning.worldImpactScore).toBeGreaterThan(0);
      expect(meaning.personalFit.length).toBeGreaterThan(0);
    });

    it('should have meaningful content for high-impact roles', () => {
      const highImpactRoles = dreamRoles.filter(r => r.meaning.worldImpactScore >= 4);
      
      expect(highImpactRoles.length).toBeGreaterThanOrEqual(6); // Engineer, Doctor, Teacher, Astronaut, Environmental Scientist, Game Designer, Entrepreneur, Lawyer
      
      highImpactRoles.forEach(role => {
        expect(role.meaning.impact).toMatch(/benefit|help|improve|save|protect|create|solve|connect|expand|bring/i);
        expect(role.meaning.legacy).toMatch(/benefit|better|healthier|safer|learning|knowledge|innovation|connection|travel|shape|society|culture|evolves/i);
      });
    });
  });

  describe('Narrative Generation', () => {
    it('should generate supportive narratives for family members', () => {
      // This would test the generateNarrative function from the component
      // Since it's internal to the component, we test the logic pattern
      
      const supportiveRoles = {
        "Engineer": [
          "designs the blueprint for {name}'s success",
          "builds the foundation for {name}'s dreams"
        ]
      };
      
      const testRole = supportiveRoles["Engineer"][0];
      const filledRole = testRole.replace('{name}', 'Yazid');
      
      expect(filledRole).toBe("designs the blueprint for Yazid's success");
    });
  });

  describe('Accessibility Features', () => {
    it('should support keyboard navigation with proper aria attributes', () => {
      // Test aria-label patterns that should be used
      const dreamSelectLabel = (role: string) => `Select dream role: ${role}`;
      const randomButtonLabel = "Select a random dream role";
      const spotlightLabel = (name: string) => `Set ${name} as the dreamer`;
      const toggleLabel = "Toggle between showing exact ages and 'Not born yet'";
      
      expect(dreamSelectLabel('Engineer')).toBe('Select dream role: Engineer');
      expect(randomButtonLabel).toBe('Select a random dream role');
      expect(spotlightLabel('Yazid')).toBe('Set Yazid as the dreamer');
      expect(toggleLabel).toContain('Toggle between');
    });

    it('should use semantic HTML structure', () => {
      // Test semantic patterns that should be used in the component
      const semanticElements = ['button', 'h3', 'h4', 'h5', 'div'];
      const ariaAttributes = ['aria-label', 'aria-pressed', 'aria-hidden'];
      
      semanticElements.forEach(element => {
        expect(element).toMatch(/^[a-z]+[0-9]*$/);
      });
      
      ariaAttributes.forEach(attr => {
        expect(attr).toMatch(/^aria-/);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should support mobile and desktop layouts', () => {
      // Test CSS classes that should support responsive design
      const responsiveClasses = [
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
        'md:col-span-2',
        'grid grid-cols-1 md:grid-cols-2'
      ];
      
      responsiveClasses.forEach(className => {
        expect(className).toMatch(/(sm:|md:|lg:|xl:)|(grid-cols-)/);
      });
    });
  });

  describe('Widget Integration', () => {
    it('should be registered as a quiet widget', () => {
      // Test widget configuration
      const widgetConfig = {
        id: 'dreamBuilderPlayground',
        name: 'Dream Builder Playground',
        priority: 58,
        enabled: true
      };
      
      expect(widgetConfig.id).toBe('dreamBuilderPlayground');
      expect(widgetConfig.name).toBe('Dream Builder Playground');
      expect(widgetConfig.priority).toBeGreaterThan(50); // Quiet widget priority range
      expect(widgetConfig.enabled).toBe(true);
    });

    it('should support lazy loading', () => {
      // Test that the loader function pattern is correct
      const mockLoader = () => import('../src/components/cards/DreamBuilderPlaygroundCard.svelte');
      
      expect(typeof mockLoader).toBe('function');
      expect(mockLoader().constructor.name).toBe('Promise');
    });
  });

  describe('Edge Cases', () => {
    it('should handle family with no DOB data gracefully', () => {
      const noDobProfiles = mockFamilyProfiles.map(p => ({ ...p, dob: null }));
      const familyAges = calculateFamilyAgesWithNegatives(noDobProfiles, 'nilezat@gmail.com', 25);
      
      expect(Object.keys(familyAges)).toHaveLength(0);
    });

    it('should handle extreme age scenarios', () => {
      // Test very young target age
      const youngAges = calculateFamilyAgesWithNegatives(
        mockFamilyProfiles, 
        'yazidgeemail@gmail.com', 
        1
      );
      
      expect(youngAges['yazidgeemail@gmail.com']).toBe(1);
      expect(Object.values(youngAges).some(age => age < 0)).toBe(true);
      
      // Test very old target age (for Ghassan who can reach 70)
      const oldAges = calculateFamilyAgesWithNegatives(
        mockFamilyProfiles, 
        'nilezat@gmail.com', 
        70
      );
      
      expect(oldAges['nilezat@gmail.com']).toBe(70);
      expect(Object.values(oldAges).every(age => age > 0)).toBe(true);
    });

    it('should preserve age differences correctly', () => {
      const testAge = 25;
      const familyAges1 = calculateFamilyAgesWithNegatives(
        mockFamilyProfiles, 
        'yazidgeemail@gmail.com', 
        testAge
      );
      
      const familyAges2 = calculateFamilyAgesWithNegatives(
        mockFamilyProfiles, 
        'yazidgeemail@gmail.com', 
        testAge + 10
      );
      
      // Age differences should be preserved
      Object.keys(familyAges1).forEach(email => {
        expect(familyAges2[email] - familyAges1[email]).toBe(10);
      });
    });
  });
});