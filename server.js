"use strict";
/*eslint no-confusing-arrow: "off"*/
/*eslint no-process-env: "off"*/

var express = require('express');
var app = express();
var log = require('iphb-logs');

// ***********************************************************************
// Respect Starphleets Configs
// ***********************************************************************
log.enable.logging = Boolean(process.env.ENABLE_LOGGING);
log.enable.debug = Boolean(process.env.ENABLE_DEBUG);
log.enable.verbose = Boolean(process.env.ENABLE_VERBOSE);

// ***********************************************************************
// Environment Configs and Defaults
// ***********************************************************************

const _defaultRedirect = process.env.DEFAULT_REDIRECT || "https://discord.gg/n9Jj2YJ";

// ***********************************************************************
// Route Handlers
// ***********************************************************************

/**
 * Healthcheck so we won't start if we have a broken redirect config
 */
app.all('/diagnostic', (req, res) => res.json({ status: "ok" }));

/** Inject a warning in our workflow about unhandled redirects */
const _warnAndRedirectToDefault = (req, res) => {
	log.warn(`unhandled redirect: host="${req.headers.host}" url="${req.originalUrl}"`);
	return res.redirect(_defaultRedirect);
};

/**
 * Only need one route.  This express server will always redirect the caller to a new location.
 *
 * If we find the HOST and PATH in the config we will 301 the user to the destination provided,
 * otherwise we will send the user to our "default" redirect
 */
app.all('*', (req, res) => _warnAndRedirectToDefault(req, res));

// Start your engines...
const serverPort = process.env.PORT || 3000;
app.listen(serverPort, () => log.info(`Express listening at http://0.0.0.0/${serverPort}`));
