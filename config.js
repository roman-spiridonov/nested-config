/**
 * Created by Roman Spiridonov <romars@phystech.edu> on 5/6/2017.
 */
"use strict";

const helpers = require('./helpers');


/**
 * Nested configuration wrapper.
 * @param config {object} - current configuration (leave empty {} if you want all current values to equal defaults)
 * @param defaults {object} - default configuration
 * @constructor
 */
function Config(config, defaults) {
    this._defaults = {};
    this.add(config, defaults);
}

/**
 * Add more config options (overrides repeated ones).
 * @param config {object} - current config values to add
 * @param defaults {object} - default config values to add (leave empty {} if you do not want to change default values)
 * @param [options] {object}
 * @param [options.arrayBehavior] {number} - a flag identifying behavior of deep merge for arrays:
 * 0 (default) - replace with copy, 1 - append (push), 2 - replace with link (will mutate source).
 * @param [options.skipFunc] {function} - function that gets current target and source properties and returns true if this copy operation should be skipped.
 * Note that target property can be undefined if it is a new property for target.
 * @returns {Config} resulting config (reference to this)
 */
Config.prototype.add = function (config, defaults = {}, options = {}) {
    if(options && options.mutate === false) delete options.mutate;  // we always need to mutate this in next step
    helpers.mergeDeep(this, defaults, config, options || {});
    helpers.mergeDeep(this._defaults, defaults, options || {});

    return this;
};

/**
 * Get the default value of a property in a format like "formula.output".
 * @param {string} propStr - Reference to a property as a "." delimited string
 * @returns {*} value of the property or undefined
 */
Config.prototype.getDefault = function (propStr) {
    return this.getPropRef(propStr, this._defaults);
};

/**
 * Parse config property in a format like "formula.output" and return prop ref.
 * @param {string} propStr - Reference to a property as a "." delimited string
 * @param {Object} target - Object to look at
 */
Config.prototype.getPropRef = function (propStr, target = this) {
    if (!propStr || propStr === '') {
        return target;
    }

    let interimProps = propStr.split('.');
    let res = target;
    for (let i = 0; i < interimProps.length; i++) {
        let prop = interimProps[i];
        if (i === 0) {
            res = target[prop];
            continue;
        }
        res = res[prop];
    }

    return res;
};

exports.Config = Config;
