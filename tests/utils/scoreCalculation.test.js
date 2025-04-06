'use strict';

const { calculateScore } = require('../../src/utils/scoreCalculation');

describe('Score Calculation Utility', () => {
  describe('calculateScore', () => {
    test('should calculate correct score for step level with percentComplete < 100', () => {
      const result = calculateScore({
        moduleLevel: 'step',
        moduleOrder: 3,
        percentComplete: 45
      });
      expect(result).toBe(3.45);
    });

    test('should calculate correct score for stage level with percentComplete < 100', () => {
      const result = calculateScore({
        moduleLevel: 'stage',
        moduleOrder: 2,
        percentComplete: 75
      });
      expect(result).toBe(8.75); // 2 + 6 + (75/100)
    });

    test('should round up to next level when percentComplete is 100', () => {
      const result = calculateScore({
        moduleLevel: 'step',
        moduleOrder: 4,
        percentComplete: 100
      });
      expect(result).toBe(5); // 4 + 1
    });

    test('should handle zero percentComplete correctly', () => {
      const result = calculateScore({
        moduleLevel: 'stage',
        moduleOrder: 1,
        percentComplete: 0
      });
      expect(result).toBe(7); // 1 + 6 + 0
    });

    test('should handle small percentComplete values correctly', () => {
      const result = calculateScore({
        moduleLevel: 'step',
        moduleOrder: 5,
        percentComplete: 3
      });
      expect(result).toBe(5.03); // 5 + (3/100)
    });

    test('should return correct score when moduleOrder is 0', () => {
      const result = calculateScore({
        moduleLevel: 'step',
        moduleOrder: 0,
        percentComplete: 50
      });
      expect(result).toBe(0.5); // 0 + (50/100)
    });
  });
}); 