'use strict';

const {
  getStatusFromPercent
} = require('../../../utils/reports')

const { calculateScore } = require('../../../utils/scoreCalculation');

/**
 * competency service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::competency.competency', ({ strapi }) => ({
  /**
   * Custom function to update competency status and adaptation
   */
  async updateCustomCompetency({ id, status, adaptation }) {
    const knex = strapi.db.connection;

    // Start a transaction
    const trx = await knex.transaction();

    try {
      // Get the competency with its level relationship
      const competency = await knex('competencies')
        .select('competencies.*', 'competencies_level_links.level_id as level')
        .leftJoin('competencies_level_links', 'competencies.id', 'competencies_level_links.competency_id')
        .where('competencies.id', id)
        .first()
        .transacting(trx);

      if (competency.level) {
        const totalCapabilities = await knex('capabilities')
          .count('* as count')
          .join('capabilities_module_links', 'capabilities.id', 'capabilities_module_links.capability_id')
          .where({
            'capabilities_module_links.module_id': knex('levels')
              .select('levels_module_links.module_id')
              .leftJoin('levels_module_links', 'levels.id', 'levels_module_links.level_id')
              .where('levels.id', competency.level)
          })
          .first()
          .transacting(trx);

        const completedCompetencies = await knex('competencies')
          .count('* as count')
          .join('competencies_level_links', 'competencies.id', 'competencies_level_links.competency_id')
          .where({
            'competencies_level_links.level_id': competency.level,
            status: 'complete'
          })
          .first()
          .transacting(trx);

        const percentComplete = parseInt((completedCompetencies.count / totalCapabilities.count) * 100) ?? 0;
        const levelStatus = getStatusFromPercent(percentComplete);

        // Update the level in the database within the transaction
        await knex('levels')
          .where({ id: competency.level })
          .update({
            percent_complete: percentComplete,
            status: levelStatus,
            updated_at: new Date()
          })
          .transacting(trx);

        // Commit the transaction
        await trx.commit();

        // After the transaction is committed, use Strapi's entity service to update the level
        // This will trigger the lifecycle hooks
        await strapi.entityService.update('api::level.level', competency.level, {
          data: {
            percentComplete: percentComplete,
            status: levelStatus
          }
        });

        // Also update any PupilSubjectScore directly in case the lifecycle hook doesn't work
        await this.updatePupilSubjectScore(competency.level, percentComplete);
      } else {
        // If there's no level, just commit the transaction
        await trx.commit();
      }
    } catch (error) {
      // Roll back the transaction
      await trx.rollback();
      strapi.log.error('Transaction failed:', error);
      throw new Error('Transaction failed: ' + error.message);
    }
  },

  /**
   * Helper function to update the PupilSubjectScore directly
   */
  async updatePupilSubjectScore(levelId, percentComplete) {
    try {
      // Get the level with pupil and subject
      const level = await strapi.entityService.findOne('api::level.level', levelId, {
        populate: ['pupil', 'subject', 'module'],
      });

      if (!level || !level.pupil || !level.subject || !level.module) {
        return;
      }

      // Get the pupil and subject IDs
      const pupilId = level.pupil.id;
      const subjectId = level.subject.id;

      // Calculate the score using the utility function
      const score = calculateScore({
        moduleLevel: level.module.level,
        moduleOrder: level.module.order,
        percentComplete
      });

      // Check if a PupilSubjectScore already exists
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
            publishedAt: new Date()
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
            publishedAt: new Date()
          }
        });

        console.log(`Created new PupilSubjectScore for pupil ${pupilId} and subject ${subjectId} with score ${score}`);
      }
    } catch (error) {
      console.error('Error directly updating PupilSubjectScore:', error);
    }
  }
}));