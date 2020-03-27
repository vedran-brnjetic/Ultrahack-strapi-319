'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const _ = require('lodash');

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
find(ctx) {
    if (ctx.query._q) {
      return strapi.services.teammember.search(ctx.query);
    }
    return strapi.services.teammember.find(ctx.query);
  },
async create(ctx) {
  let data = ctx.request.body;
  const oldUser = Boolean(data.profile); 
  let entity;
  //message
  let m = {};
  //console.log(JSON.stringify(data.team.challenge.event));

  m.you = "Dear ";
  m.invited = "You have been invited to join an exciting challenge at Ultrahack platform with the team " + data.team.name +".";
  m.by = data.team.team_lead.display_name + " and the rest of the team would like you to help them with your skills.";
  m.toChallenge = "Together you have a better chance of winning the \"" + data.team.challenge.title + "\" challenge!";
  m.pleaseJoin = "To join the team, please visit https://alpha-1.ultrahacker.click/challenge/" + data.team.challenge.id + "/" + data.team.challenge.slug + (oldUser ? ("/" + data.team.id + "/" + data.team.name):"");
  
  let event = await strapi.services.event.findOne({id: data.team.challenge.event});
  event = JSON.parse(JSON.stringify(event));
  //console.log(">>>>>>>>>>>" + typeof event.application_deadline + "<<<<<<<<<<");
  const deadline = new Date(Date.parse(event.application_deadline));
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  m.deadline = "Hurry up and join, the application deadline is on " + deadline.toLocaleDateString("en-GB", options) + ".";


  let recipient = oldUser ? data.profile.user.email : data.email;
  
    await strapi.plugins['email'].services.email.send({
        to: recipient,
        from: 'info@ultrahacker.click',
        subject: 'Team invitation on Ultrahack platform',
        text: m.you +  recipient + ',\n\n' + m.invited + '\n\n' + m.by + " " + m.toChallenge + "\n\n" + m.pleaseJoin + "\n\n" + m.deadline
      });

    const model = strapi.models.teammember;

    delete data.email;

    if (ctx.is('multipart')) {
      //console.log("teammember multipart flag");
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.teammember.create(data, { files });
    } else {
      //console.log(ctx.request.body);
      //let user = {};
         entity = await strapi.services.teammember.create(data);
    }
    return sanitizeEntity(entity, { model });

},
};

