'use strict';

/**
 * user-password-generator service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-password-generator.user-password-generator');