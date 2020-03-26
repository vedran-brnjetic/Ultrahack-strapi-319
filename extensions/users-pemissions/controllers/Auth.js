'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const crypto = require('crypto');
const _ = require('lodash');

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = {
register: async ctx => {
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore.get({
      key: 'advanced',
    });

    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        ctx.request.admin
          ? [{ messages: [{ id: 'Auth.advanced.allow_register' }] }]
          : 'Register action is currently disabled.',
      );
    }

    const params = _.assign(ctx.request.body, {
      provider: 'local',
    });

    // Password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        ctx.request.admin
          ? [{ messages: [{ id: 'Auth.form.error.password.provide' }] }]
          : 'Please provide your password.',
      );
    }

    // Throw an error if the password selected by the user
    // contains more than two times the symbol '$'.
    if (
      strapi.plugins['users-permissions'].services.user.isHashed(
        params.password,
      )
    ) {
      return ctx.badRequest(
        null,
        ctx.request.admin
          ? [{ messages: [{ id: 'Auth.form.error.password.format' }] }]
          : 'Your password cannot contain more than three times the symbol `$`.',
      );
    }



//    const role = await strapi.plugins['users-permissions'].queries('role', 'users-permissions')
//      .findOne({ type: params.role === 'hacker' ? settings.default_role: params.role }, []);


      const role = await strapi.query('role', 'users-permissions')
        .findOne({ type: (params.role) ? params.role : settings.default_role }, []);


    if (!role) {
      return ctx.badRequest(
        null,
        ctx.request.admin
          ? [{ messages: [{ id: 'Auth.form.error.role.notFound' }] }]
          : 'Impossible to find the default role.',
      );
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    }

    params.role = role._id || role.id;
    params.password = await strapi.plugins[
      'users-permissions'
    ].services.user.hashPassword(params);

    const user = await strapi.query('user', 'users-permissions').findOne({
      email: params.email,
    });

    if (user && user.provider === params.provider) {
      return ctx.badRequest(
        null,
        ctx.request.admin
          ? [{ messages: [{ id: 'Auth.form.error.email.taken' }] }]
          : 'Email is already taken.',
      );
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest(
        null,
        ctx.request.admin
          ? [{ messages: [{ id: 'Auth.form.error.email.taken' }] }]
          : 'Email is already taken.',
      );
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      const user = await strapi.query('user', 'users-permissions')
        .create(params);

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue(
        _.pick(user.toJSON ? user.toJSON() : user, ['_id', 'id']),
      );

      if (settings.email_confirmation) {
        const storeEmail =
          (await pluginStore.get({
            key: 'email',
          })) || {};

        const settings = storeEmail['email_confirmation']
          ? storeEmail['email_confirmation'].options
          : {};

        settings.message = await strapi.plugins[
          'users-permissions'
        ].services.userspermissions.template(settings.message, {
          URL: new URL(
            '/auth/email-confirmation',
            strapi.config.url,
          ).toString(),
          USER: _.omit(user.toJSON ? user.toJSON() : user, [
            'password',
            'resetPasswordToken',
            'role',
            'provider',
          ]),
          CODE: jwt,
        });

        settings.object = await strapi.plugins[
          'users-permissions'
        ].services.userspermissions.template(settings.object, {
          USER: _.omit(user.toJSON ? user.toJSON() : user, [
            'password',
            'resetPasswordToken',
            'role',
            'provider',
          ]),
        });

        try {
          // Send an email to the user.
          await strapi.plugins['email'].services.email.send({
            to: (user.toJSON ? user.toJSON() : user).email,
            from:
              settings.from.email && settings.from.name
                ? `"${settings.from.name}" <${settings.from.email}>`
                : undefined,
            replyTo: settings.response_email,
            subject: settings.object,
            text: settings.message,
            html: settings.message,
          });
        } catch (err) {
          return ctx.badRequest(null, err);
        }
      }

      ctx.send({
        jwt,
        user: _.omit(user.toJSON ? user.toJSON() : user, [
          'password',
          'resetPasswordToken',
        ]),
      });
    } catch (err) {
      const adminError = _.includes(err.message, 'username')
        ? 'Auth.form.error.username.taken'
        : 'Auth.form.error.email.taken';

      ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: adminError }] }] : err.message,
      );
    }
  },

  emailConfirmation: async ctx => {
    const params = ctx.query;

    const user = await strapi.plugins['users-permissions'].services.jwt.verify(
      params.confirmation
    );

    await strapi.plugins['users-permissions'].services.user.edit(
      _.pick(user, ['_id', 'id']),
      { confirmed: true }
    );

    const settings = await strapi
      .store({
        environment: '',
        type: 'plugin',
        name: 'users-permissions',
        key: 'advanced',
      })
      .get();

    const userp = await strapi.query('user', 'users-permissions').findOne({
      id: user.id
    });
    const profiled = await strapi.query('Profile').findOne({user: userp.id});
    //console.log(profiled);
    if(!profiled) await strapi.query('Profile').create({"display_name":userp.username, "user":userp.id});

    ctx.redirect(settings.email_confirmation_redirection || '/');
  },
};
