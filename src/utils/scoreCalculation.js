'use strict';

/**
 * Score calculation utility functions
 */

/**
 * Calculates a pupil subject score based on the module level, order, and percent complete
 * 
 * @param {Object} options - The options object
 * @param {string} options.moduleLevel - The module level (e.g., "stage", "step")
 * @param {number} options.moduleOrder - The module order
 * @param {number} options.percentComplete - The percentage complete (0-100)
 * @returns {number} The calculated score
 */
function calculateScore({ moduleLevel, moduleOrder, percentComplete }) {
  // Get the normalized module number (1-12 scale)
  const normalisedModuleNumber = moduleLevel === "stage" ? moduleOrder + 6 : moduleOrder;
  
  // Calculate the score properly as a decimal
  if (percentComplete === 100) {
    // If the level is 100% complete, round up to the next level
    return normalisedModuleNumber + 1;
  } else {
    // Format as proper decimal
    return normalisedModuleNumber + (percentComplete / 100);
  }
}

module.exports = {
  calculateScore
}; 