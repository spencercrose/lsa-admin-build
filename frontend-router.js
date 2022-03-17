/*!
 * Frontend static file router
 * File: frontend.router.js
 * Copyright(c) 2022 BC Gov
 * MIT Licensed
 */

const express = require('express')
const router = express.Router()

/**
 * Serve index page.
 */

router.get('/', function (req, res) {
    res.sendFile('/app/views/index.html');
});
module.exports = router;
