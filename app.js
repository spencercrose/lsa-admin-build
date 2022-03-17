/*!
 * Long Service Awards web application (admin)
 * File: app.js
 * Copyright(c) 2022 BC Gov
 * MIT Licensed
 */

'use strict';

const express = require('express');
const frontendRouter = require('./frontend-router');
const apiRouter = require('./frontend-router');
const history = require('connect-history-api-fallback');
const path = require('path');
const cors = require('cors');
const {notFoundHandler, globalHandler} = require('./error');
const cookieParser = require('cookie-parser');
const {authenticate} = require('./auth.services')

/**
 * Express Security Middleware
 *
 * Hide Express usage information from public.
 * Use Helmet for security HTTP headers
 * - Strict-Transport-Security enforces secure (HTTP over SSL/TLS)
 *   connections to the server
 * - X-Frame-Options provides clickjacking protection
 * - X-XSS-Protection enables the Cross-site scripting (XSS)
 *   filter built into most recent web browsers
 * - X-Content-Type-Options prevents browsers from MIME-sniffing
 *   a response away from the declared _static-type
 *   Content-Security-Policy prevents a wide range of attacks,
 *   including Cross-site scripting and other cross-site injections
 *
 *   Online checker: http://cyh.herokuapp.com/cyh.
 */

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ["https://lsaapp.gww.gov.bc.ca", "http://lsa-registration-node"]
    : [
      "http://localhost:3000",
      "http://localhost",
    ];

const corsConfig = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not " +
        "allow access from the specified origin: \n" + origin;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

/**
 * Frontend application (Vue) server
 */

const frontend = express();
frontend.disable('x-powered-by');
frontend.use(express.json());
frontend.use(express.urlencoded({ extended: true }));
frontend.use(cors(corsConfig));
frontend.use(history());
frontend.get('/', frontendRouter);
frontend.use('/', express.static(path.join(__dirname, 'views')));
console.log('Serving frontend build at ', path.join(__dirname, 'views'));

/**
 * API server
 */

const api = express();
api.disable('x-powered-by');
// app.use(helmet({contentSecurityPolicy: false}));
api.use(express.json());
api.use(express.urlencoded({ extended: true }));
api.use(cors(corsConfig));

// parse cookies to store session data
api.use(cookieParser(
  process.env.COOKIE_SECRET || 'testsecret'
));

// log all requests
api.use(function timeLog (req, res, next) {
  const d = new Date();
  console.log('Request: ', req.method, req.path, d);
  next();
});

// authenticate user for all routes
api.all('*', authenticate);

// initialize routers for API calls
api.use('/', apiRouter);

// handle generic errors
api.use(globalHandler);

// handle 404 errors
api.use(notFoundHandler);

// set port, listen for requests
frontend.listen(3000, () => {
  console.log(`Frontend served on port 3000`);
});
api.listen(3001, () => {
  console.log(`API server is running on port 3001`);
  console.log(`Run mode: ${process.env.NODE_ENV}`)
});
