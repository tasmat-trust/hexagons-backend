'use strict';

const { calculateScore } = require('../../../../utils/scoreCalculation');

/**
 * Lifecycle hooks for the Snapshot model
 * This file implements the afterCreate hook to automatically create PupilSubjectScores
 * and targets for each pupil/subject combination when a snapshot is created
 */

module.exports = {
  async afterCreate(event) {
    // First create or update PupilSubjectScores
    const pupilSubjectScores = await createPupilSubjectScores(event);
    
    // Then create targets based on those scores
    await createTargetsFromScores(event, pupilSubjectScores);
  },
};

/**
 * Helper function to create PupilSubjectScores for all pupils when a snapshot is created
 * @returns {Array} Array of created and existing PupilSubjectScores
 */
async function createPupilSubjectScores(event) {
  try {
    // Get all pupils
    const pupils = await strapi.entityService.findMany('api::pupil.pupil', {
      fields: ['id', 'name', 'targetLevel'],
    });
    
    // Get all subjects
    const subjects = await strapi.entityService.findMany('api::subject.subject', {
      fields: ['id', 'name'],
    });
    
    console.log(`Creating PupilSubjectScores for ${pupils.length} pupils and ${subjects.length} subjects`);
    
    // Get all existing PupilSubjectScores to avoid duplicates
    const existingScores = await strapi.entityService.findMany('api::pupil-subject-score.pupil-subject-score', {
      populate: {
        pupil: {
          fields: ['id', 'name', 'targetLevel']
        },
        subject: {
          fields: ['id', 'name']
        }
      },
      pagination: { limit: -1 }
    });
    
    // Create a map of existing scores for quick lookup
    const existingScoreMap = {};
    existingScores.forEach(score => {
      if (score.pupil && score.subject) {
        const key = `${score.pupil.id}_${score.subject.id}`;
        existingScoreMap[key] = score;
      }
    });
    
    // Get all levels to calculate scores
    const allLevels = await strapi.entityService.findMany('api::level.level', {
      populate: ['pupil', 'subject', 'module'],
      pagination: { limit: -1 }
    });
    
    // Group levels by pupil and subject
    const levelsByPupilAndSubject = {};
    allLevels.forEach(level => {
      if (level.pupil && level.subject) {
        const key = `${level.pupil.id}_${level.subject.id}`;
        if (!levelsByPupilAndSubject[key]) {
          levelsByPupilAndSubject[key] = [];
        }
        levelsByPupilAndSubject[key].push(level);
      }
    });
    
    // Prepare batch of PupilSubjectScores to create
    const scoresToCreate = [];
    const now = new Date();
    
    // For each pupil/subject combination
    for (const pupil of pupils) {
      for (const subject of subjects) {
        const key = `${pupil.id}_${subject.id}`;
        
        // Skip if already exists
        if (existingScoreMap[key]) {
          continue;
        }
        
        // Calculate the score based on the levels
        let score = 0;
        const levels = levelsByPupilAndSubject[key] || [];
        
        if (levels.length > 0) {
          // Sort levels by createdAt in descending order
          levels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const level = levels[0]; // Most recent level
          
          if (level.module) {
            // Handle both percentComplete and percent_complete field names
            const percentComplete = level.percentComplete || level.percent_complete || 0;
            
            // Calculate the score using the utility function
            score = calculateScore({
              moduleLevel: level.module.level,
              moduleOrder: level.module.order,
              percentComplete
            });
          }
        }
        
        // Add to batch
        scoresToCreate.push({
          pupil: pupil.id,
          subject: subject.id,
          current_score: score,
          publishedAt: now
        });
      }
    }
    
    // Create PupilSubjectScores in batches for better performance
    const BATCH_SIZE = 100;
    const createdScores = [];
    
    for (let i = 0; i < scoresToCreate.length; i += BATCH_SIZE) {
      const batch = scoresToCreate.slice(i, i + BATCH_SIZE);
      const createPromises = batch.map(scoreData => 
        strapi.entityService.create('api::pupil-subject-score.pupil-subject-score', { 
          data: scoreData,
          populate: {
            pupil: {
              fields: ['id', 'name', 'targetLevel']
            },
            subject: {
              fields: ['id', 'name']
            }
          }
        })
      );
      const batchResults = await Promise.all(createPromises);
      createdScores.push(...batchResults);
    }
    
    console.log(`Created ${createdScores.length} PupilSubjectScores`);
    
    // Return both existing and newly created scores
    return [...existingScores, ...createdScores];
  } catch (error) {
    console.error('Error creating PupilSubjectScores:', error);
    return [];
  }
}

/**
 * Helper function to create targets based on PupilSubjectScores
 */
async function createTargetsFromScores(event, pupilSubjectScores) {
  const { result } = event;
  const { id: snapshotId } = result;
  
  try {
    console.log(`Creating targets for ${pupilSubjectScores.length} PupilSubjectScores`);
    
    // Prepare batch of targets to create
    const targetsToCreate = [];
    const now = new Date();
    
    // For each PupilSubjectScore
    for (const score of pupilSubjectScores) {
      if (!score.pupil || !score.subject) continue;
      
      // Parse the current score
      let currentScore = parseFloat(score.current_score);
      if (isNaN(currentScore)) currentScore = 0;
      
      // Get pupil's targetLevel to determine increment
      let targetIncrement;
      if (score.pupil.targetLevel) {
        switch (score.pupil.targetLevel) {
          case 'small':
            targetIncrement = 0.2;
            break;
          case 'large':
            targetIncrement = 0.5;
            break;
          case 'medium':
          default:
            targetIncrement = 0.4;
        }
      } else {
        targetIncrement = 0.4; // default for medium
      }
      
      // Calculate target score (current + targetLevel increment)
      const targetScore = currentScore + targetIncrement;
      
      // Add to batch
      targetsToCreate.push({
        snapshot: snapshotId,
        pupil: score.pupil.id,
        subject: score.subject.id,
        pupilSubjectScore: score.id, // Link to the PupilSubjectScore
        initial_score: currentScore, // Keep initial score for historical reference
        target_score: targetScore.toFixed(2), // Format to 2 decimal places
        publishedAt: now,
      });
    }
    
    // Create targets in batches for better performance
    const BATCH_SIZE = 100;
    for (let i = 0; i < targetsToCreate.length; i += BATCH_SIZE) {
      const batch = targetsToCreate.slice(i, i + BATCH_SIZE);
      const createPromises = batch.map(targetData => 
        strapi.entityService.create('api::target.target', { data: targetData })
      );
      await Promise.all(createPromises);
    }
    
    console.log(`Created ${targetsToCreate.length} targets for snapshot ${snapshotId}`);
  } catch (error) {
    console.error('Error creating targets:', error);
  }
} 