"use strict";
/*eslint no-confusing-arrow: "off"*/
/*eslint no-process-env: "off"*/

var express = require('express');
var app = express();
var log = require('iphb-logs');
var fs = require('fs-promise');
var recursiveJSONKeyTransform = require('recursive-json-key-transform');

// ***********************************************************************
// Respect Starphleets Configs
// ***********************************************************************
log.enable.logging = Boolean(process.env.ENABLE_LOGGING);
log.enable.debug = Boolean(process.env.ENABLE_DEBUG);
log.enable.verbose = Boolean(process.env.ENABLE_VERBOSE);

// ***********************************************************************
// Environment Configs and Defaults
// ***********************************************************************

const _defaultRedirect = process.env.DEFAULT_REDIRECT || "https://glg.it";
const _redirectsJSONFile = process.env.REDIRECT_FILE_PATH || "./redirects.json";

// ***********************************************************************
// Helper
// ***********************************************************************

/**
 * Cache the redirects file and only load it once
 */
let redirectsCache = null;
const keysToLowerCase = recursiveJSONKeyTransform((key) => key.toLowerCase());
const _getRedirects = () => redirectsCache ? Promise.resolve(redirectsCache) : fs.readFile(_redirectsJSONFile, "utf8")
  .then(fileContents => JSON.parse(fileContents))
  .then(redirects => {
    redirectsCache = keysToLowerCase(redirects);
    return redirectsCache;
  })
  .catch(e => {
    log.error("Something went wrong with the redirects file [", _redirectsJSONFile, "] ", e.toString());
    process.exit(1);
  });

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
app.all('*', (req, res) => _getRedirects()
  .then(redirects => redirects[req.headers.host.toLowerCase()][req.originalUrl.toLowerCase()])
  .then(url => url ? res.redirect(url) : _warnAndRedirectToDefault(req, res))
  .catch(() => _warnAndRedirectToDefault(req, res)));


// Start your engines...
const serverPort = process.env.PORT || 3000;
app.listen(serverPort, () => log.info(`Express listening at http://0.0.0.0/${serverPort}`));
