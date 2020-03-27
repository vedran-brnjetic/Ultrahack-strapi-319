'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/services.html#core-services)
 * to customize this service
 */

module.exports = {

  async create(data, { files } = {}) {
      //console.log(JSON.stringify(data));

      if(data.media_files_mapping === null){
        data.media_files_mapping = {"ArrayObject":[]};
      }
      //console.log(">>>>>>>>>>>>>>>> SUB SERVICE <<<<<<<<<<<<<<<<<<<<<");

      const entry = await strapi.query("submission").create(data);
   
      if (files) {
        // automatically uploads the files based on the entry and the model
        await this.uploadFiles(entry, files, { model: strapi.models.submission });
        return this.findOne({ id: entry.id });
      }

      return entry;
    },
    async update(params, data, { files } = {}) {
    console.log(JSON.stringify(data));
    const entry = await strapi.query("submission").update(params, data);
    console.log(JSON.stringify(entry));
    if (files) {
      // automatically uploads the files based on the entry and the model
      await this.uploadFiles(entry, files, { model: strapi.models.sumbission });
      return this.findOne({ id: entry.id });
    }
    
    return entry;
  },
};
