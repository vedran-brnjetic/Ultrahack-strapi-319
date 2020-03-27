'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    let entity;
    const model = strapi.models.submission;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.submission.create(data, { files });
    } else {
      ctx.request.body.media_files_mapping = {"ArrayObject": []};
      //console.log(">>>>>>>>>>>>>>>>>> SUB CONTROLLER <<<<<<<<<<<<<<<<<<<<");
      entity = await strapi.services.submission.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model });
  },
  async update(ctx) {
    const submissionID = ctx.request.url.split("/")[2];
    console.log("SubmissionID - " + submissionID);

    let entity;
     if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.submission.update(ctx.params, data, {
        files,
      });
    } else {
      entity = await strapi.services.submission.update(
        ctx.params,
        ctx.request.body
      );
    }
    

    return sanitizeEntity(entity, { model: strapi.models.submission });
  },
};
