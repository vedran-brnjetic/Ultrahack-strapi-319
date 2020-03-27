'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/services.html#core-services)
 * to customize this service
 */

module.exports = {
  async notifyall(teamId, message, subject){
    Promise.all().then(function(){
      let team = strapi.query('team').findOne(teamId,["team_lead","team_members"]);
      team.team_members.map(member => console.log(JSON.stringify(member)))
    });
    
    await strapi.plugins['email'].services.email.send({
        to: recipient,
        from: 'info@ultrahacker.click',
        subject: subject,
        text: message
    });
  }

};
