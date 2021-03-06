/*jshint bitwise: false*/
"use strict";

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

/**
 * Deep merge of nested objects (mutates 1st argument by default0.
 * Supports skipping of keys using skipFunc callback.
 * @param target {object}
 * @param source {...object} - comma-separated objects
 * @param [options] {object}
 * @param [options.arrayBehavior] {number} - a flag identifying behavior of deep merge for arrays:
 * 0 (default) - replace with copy, 1 - append (push), 2 - replace with link (will mutate source).
 * @param [options.skipFunc] {function} - function that gets current target and source properties and returns true if this copy operation should be skipped.
 * Note that target property can be undefined if it is a new property for target.
 * @param [options.mutate] {boolean} - mutate target object? true (default) - yes, false - no, return a deep copy.
 * @returns {object}
 */
function mergeDeep(target) {
    let arrayBehavior = 0, skipFunc,
      hasOptions = false;
    let sources = [].slice.call(arguments, 1),
      len = sources.length;

    if (!len) return target;

    if (sources[len - 1] &&
      typeof sources[len - 1].arrayBehavior === 'number' ||
      typeof sources[len - 1].skipFunc === 'function' ||
      typeof sources[len - 1].mutate === 'boolean') {  // if options provided

        // create a deep copy of target if mutate options was passed and is false
        if (sources[len - 1].mutate === false) {
            target = mergeDeep({}, target);
            sources[len - 1].mutate = true;  // already a deep copy
        }

        arrayBehavior = sources[len - 1].arrayBehavior || 0;
        skipFunc = sources[len - 1].skipFunc;
        if (--len === 0) return target;  // the only second argument was options
        sources.pop();
        hasOptions = true;
    }

    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) { // source key is an object with props => recursion
                if (!target[key]) Object.assign(target, {[key]: {}});
                hasOptions ? mergeDeep(target[key], source[key], {skipFunc, arrayBehavior}) :
                  mergeDeep(target[key], source[key]);
            } else {  // source key is a leaf
                if (skipFunc && skipFunc(target[key], source[key])) continue;  // skip if necessary

                if (Array.isArray(source[key])) {  // target will be a deep copy of source array
                    switch (arrayBehavior) {
                        case 1:
                            if (!target[key]) Object.assign(target, {[key]: []});
                            target[key] = target[key].concat(source[key]);
                            break;
                        case 2:
                            target[key] = source[key];
                            break;
                        case 0:
                        default:
                            target[key] = source[key].slice();
                            break;
                    }
                } else if (source[key] !== undefined) {  // do not copy undefined values
                    Object.assign(target, {[key]: source[key]});
                }
            }
        }
    }

    if (hasOptions) sources.push({skipFunc, arrayBehavior});
    return mergeDeep(target, ...sources);
}


/**
 * Returns plain copy of an object, where each nested key is converted to "deep.nested.key": value.
 * @param target {object}
 * @param [condition] {function} - optional function that takes current key and returns true
 * if key does not need to be plainified (false, otherwise).
 * By default, all keys will be plainified.
 * @returns {object}
 */
function plainify(target, condition) {
    let [objectName, parent, parentKeys, mutate] = [].slice.call(arguments, 2);
    let res = mutate ? target : mergeDeep({}, target);
    let keys = Object.keys(res);

    for (let key of keys) {
        if (isObject(res[key]) && (!condition || !condition(res[key]))) {
            plainify(res[key], condition, key, res, keys, true);
            // moved all properties to parent, can remove empty object
            delete res[key];
        } else if (!parent) {
            // simply wrap into default
            res[key] = res[key];
        } else {
            // move property to parent (in addition to wrapping into default)
            let nestedKey = [objectName, key].join('.');
            parent[nestedKey] = res[key];
            parentKeys.push(nestedKey);
            delete res[key];
        }
    }

    return res;
}

exports.plainify = plainify;
exports.mergeDeep = mergeDeep;
exports.isObject = isObject;
