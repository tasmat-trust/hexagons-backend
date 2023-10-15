const { sanitizeEntity } = require('strapi-utils');
'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    const body = ctx.request.body
    await strapi.plugins['email'].services.email.send({
      to: body.email,
      from: 'Hexagons Admin',
      subject: 'Your Hexagons account details',
      text: `
      Hello ${body.username},<br/>
<br/>
      Your ${body.role} account has been created and you can login to Hexagons at <a href="${body.loginUrl}">${body.loginUrl}</a> with the following details:
      <br/>
<br/>
      email: ${body.email}<br/>
      password: ${body.password}<br/>
<br/>
      Please keep your password safe.<br/>
<br/>
      Enjoy using Hexagons!<br/>
<br/>
      Thanks,<br/>
      Hexagons Admin
        `,
    });
    const entity = { email: "sentsuccessfully@yippee.com" }
    return sanitizeEntity(entity, { model: strapi.models.userPasswordGenerator });

  },
};
