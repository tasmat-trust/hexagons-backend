'use strict';

const { calculateScore } = require('../../../../utils/scoreCalculation');

/**
 * Lifecycle hooks for the Level model
 * This file implements the afterUpdate and afterCreate hooks to automatically create or update
 * a PupilSubjectScore whenever a level is updated
 */

module.exports = {
  async afterUpdate(event) {
    await updatePupilSubjectScore(event);
  },

  async afterCreate(event) {
    await updatePupilSubjectScore(event);
  }
};

/**
 * Helper function to update the PupilSubjectScore when a level is created or updated
 */
async function updatePupilSubjectScore(event) {
  const { result } = event;

  // Skip if we don't have the necessary relations
  if (!result.pupil || !result.subject) {
    return;
  }

  try {
    // Get the pupil and subject IDs
    const pupilId = result.pupil.id || result.pupil;
    const subjectId = result.subject.id || result.subject;

    // Get the module information for this level
    const level = await strapi.entityService.findOne('api::level.level', result.id, {
      populate: ['module'],
    });

    if (!level || !level.module) {
      return;
    }

    // Handle both percentComplete and percent_complete field names
    const percentComplete = level.percentComplete || level.percent_complete || 0;

    // Calculate the score using the utility function
    const score = calculateScore({
      moduleLevel: level.module.level,
      moduleOrder: level.module.order,
      percentComplete
    });

    // Check if a PupilSubjectScore already exists for this pupil and subject
    const existingScores = await strapi.entityService.findMany('api::pupil-subject-score.pupil-subject-score', {
      filters: {
        pupil: pupilId,
        subject: subjectId
      }
    });

    if (existingScores && existingScores.length > 0) {
      // Update the existing score
      await strapi.entityService.update('api::pupil-subject-score.pupil-subject-score', existingScores[0].id, {
        data: {
          current_score: score,
          publishedAt: new Date() // Ensure it's published
        }
      });

      console.log(`Updated PupilSubjectScore for pupil ${pupilId} and subject ${subjectId} with score ${score}`);
    } else {
      // Create a new score
      await strapi.entityService.create('api::pupil-subject-score.pupil-subject-score', {
        data: {
          pupil: pupilId,
          subject: subjectId,
          current_score: score,
          publishedAt: new Date() // Ensure it's published
        }
      });

      console.log(`Created new PupilSubjectScore for pupil ${pupilId} and subject ${subjectId} with score ${score}`);
    }
  } catch (error) {
    console.error('Error updating PupilSubjectScore:', error);
  }
}