/*!
 * Authentication services
 * File: auth.services.js
 * Copyright(c) 2022 BC Gov
 * MIT Licensed
 */

const axios = require('axios');
const proxyURL = 'https://lsaapp.gww.gov.bc.ca';

'use strict';

/**
 * Authenticate user based on IDIR credentials.
 * - retrieves current session data from SAML authenticator
 * - returns user data to client in session cookies
 *
 * @param req
 * @param res
 * @param {Array} allowedRoles
 * @src public
 */

exports.authenticate = async (req, res, next) => {
  try {
    // get current user data (if authenticated)
    const {session = null, SMSESSION=''} = req.cookies || {};
    console.log('!!!', session, SMSESSION)
    let date = new Date();
    const expDays = 1;
    date.setTime(date.getTime() + (expDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    const SMSCookie = "SMSESSION=" + SMSESSION + "; " + expires + "; path=/; HttpOnly; Secure=true;";
    const SessionCookie = "session=" + session + "; " + expires + "; path=/; HttpOnly; Secure=true;";

    // call SAML API - user data endpoint
    let response = await axios.get(`${proxyURL}/user_info`, {
      headers: {
        'Cookie': `${SessionCookie} ${SMSCookie}`
      }
    });

    console.log('Response:', response)
    const {data = {}} = response || {};
    const { SMGOV_GUID=[null], username=[null] } = data || {};

    // test that tokens exist
    if ( !data || !SMGOV_GUID[0] || !username[0] )
      return next(new Error('noAuth'));

    // reformat guest user data
    // store user data in response for downstream middleware
    res.locals.user = {
      guid: SMGOV_GUID[0],
      username: username[0],
      role: 'visitor'
    };
    return next();

  } catch (err) {
    return next(err)
  }
}
