'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    let entity;
    const model = strapi.models.submissioncomment;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.submissioncomment.create(data, { files });
    } else {
      entity = await strapi.services.submissioncomment.create(ctx.request.body);
    }

    let user = await strapi.services.user.findOne(entity.profile.user);

    return sanitizeEntity(entity, { model });
  },
};

