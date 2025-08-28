import { describe, it, expect } from 'vitest';
import { ANCHOR_WIDGETS, QUIET_WIDGETS, isAnchorWidget, isQuietWidget } from '../src/lib/utils/lazyLoader';

describe('Widget Restructure Tests', () => {
	describe('Anchor Widget Classification', () => {
		it('should classify correct widgets as anchor widgets', () => {
			const expectedAnchorWidgets = [
				'reflectionMood',  // Mood ("How are you feeling today?")
				'ayah',           // Daily Ayah
				'birthday',       // BirthdayCard (mandatory if birthday data exists)
				'quiz',           // Family Quiz
				'scenario',       // What Would You Do?
				'closingRitual'   // Closing Ritual (always visible)
			];

			expect(ANCHOR_WIDGETS).toEqual(expectedAnchorWidgets);
		});

		it('should correctly identify anchor widgets using isAnchorWidget function', () => {
			expect(isAnchorWidget('reflectionMood')).toBe(true);
			expect(isAnchorWidget('ayah')).toBe(true);
			expect(isAnchorWidget('birthday')).toBe(true);
			expect(isAnchorWidget('quiz')).toBe(true);
			expect(isAnchorWidget('scenario')).toBe(true);
			expect(isAnchorWidget('closingRitual')).toBe(true);

			// Should not be anchor widgets
			expect(isAnchorWidget('wall')).toBe(false);
			expect(isAnchorWidget('analytics')).toBe(false);
		});
	});

	describe('Quiet Widget Classification', () => {
		it('should classify correct widgets as quiet widgets', () => {
			const expectedQuietWidgets = [
				'wall',                      // Family Wall
				'weeklyReflectionDigest',    // Family Reflections Digest → Parents only
				'analytics',                 // Family Insights → Parents only  
				'islamicQA',                 // Islamic Q&A → Children only
				'islamicReflectionDigest',   // Islamic Reflection Digest → Parents only
				'scenarioDigest',            // Scenario Reflection Digest → Parents only
				'professionCard',            // Family Professions → All users
				'agePlayground',             // Age Playground → All users
				'dreamBuilderPlayground',    // Dream Builder Playground → All users
				'profileQuiz'                // Legacy - merged into unified QuizCard
			];

			expect(QUIET_WIDGETS).toEqual(expectedQuietWidgets);
		});

		it('should correctly identify quiet widgets using isQuietWidget function', () => {
			expect(isQuietWidget('wall')).toBe(true);
			expect(isQuietWidget('weeklyReflectionDigest')).toBe(true);
			expect(isQuietWidget('analytics')).toBe(true);
			expect(isQuietWidget('islamicQA')).toBe(true);
			expect(isQuietWidget('scenarioDigest')).toBe(true);
			expect(isQuietWidget('professionCard')).toBe(true);
			expect(isQuietWidget('agePlayground')).toBe(true);

			// Should not be quiet widgets
			expect(isQuietWidget('reflectionMood')).toBe(false);
			expect(isQuietWidget('ayah')).toBe(false);
			expect(isQuietWidget('quiz')).toBe(false);
			expect(isQuietWidget('scenario')).toBe(false);
		});
	});

	describe('Widget Classification Integrity', () => {
		it('should not have overlapping widgets between anchor and quiet', () => {
			const anchorSet = new Set(ANCHOR_WIDGETS);
			const quietSet = new Set(QUIET_WIDGETS);
			
			const intersection = [...anchorSet].filter(widget => quietSet.has(widget as any));
			
			expect(intersection).toEqual([]);
		});

		it('should have expected total widget count', () => {
			// Total should be reasonable (not too many, not too few)
			const totalWidgets = ANCHOR_WIDGETS.length + QUIET_WIDGETS.length;
			expect(totalWidgets).toBeGreaterThan(10);
			expect(totalWidgets).toBeLessThan(20);
		});
	});
});