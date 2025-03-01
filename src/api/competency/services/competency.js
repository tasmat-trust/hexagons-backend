'use strict';

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
        const percentComplete = completedCompetencies.count / totalCapabilities.count;
        await knex('levels')
          .where({ id: competency.level })
          .update({ percent_complete: percentComplete, is_current_level: true })
          .transacting(trx);
        console.log({percentComplete})
      }

      // Commit the transaction
      await trx.commit();
    } catch (error) {
      // Roll back the transaction
      await trx.rollback();
      strapi.log.error('Transaction failed:', error);
      throw new Error('Transaction failed: ' + error.message);
    }
  },
}));
