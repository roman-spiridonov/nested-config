/**
 * Created by Roman Spiridonov <romars@phystech.edu> on 8/23/2017.
 */
"use strict";

const Config = require('./config').Config;
const helpers = require('./helpers');

exports.Config = Config;
exports.create = function (overrides, defaults) {
    return new Config(overrides, defaults);
};
exports.mergeDeep = helpers.mergeDeep;
exports.plainify = helpers.plainify;
