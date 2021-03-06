[![Build Status](https://travis-ci.org/roman-spiridonov/nested-config.svg?branch=master)](https://travis-ci.org/roman-spiridonov/nested-config)

Configuration object wrapper for nested configs.

Features:
* Nested configs
* Deep merge of config objects
* Keeping track of defaults
* Plays nicely with [nconf](https://github.com/indexzero/nconf) (see recipe below)
* See [yargs-config](https://github.com/roman-spiridonov/yargs-config) to start yargs CLI application from the config

# Usage
Create new config object using **create(overrides _[object]_, defaults _[object]_)**.

```javascript
const nc = require('nested-config');
let config = nc.create({a: 'new value'}, {a: 'default value'});
```

Now `config` is itself a configuration object. All your current settings are stored in it.
It keeps track of default options for you as well. The object has the following [API](../../wiki).

```javascript
config.a;  // 'new value'
config.getDefault('a');  // 'default value'

config.add({b: 1}, {b: 0});  // overrides, defaults
config.b;  // 1
config.getDefault('b');  // 0
```

## Initialize with your default settings
```javascript
const nc = require('nested-config');

let defaults = {
    yourOption: 1,
    nested: {
        option: "two",
        array: [1]
    }
};

let config = nc.create({yourOption: 2}, defaults);
config.yourOption;  // 2
config.nested.array; // [1] (default)
```

## Update current settings
```javascript
let overrides = {
    yourOption: 3,
    nested: {
        option: "three",
        array: [2]
    },
};

config.add(overrides, {});  // performs deep merge into current config state, leaves defaults unchanged
config.nested.array;  // [2]
```

## Access settings
```javascript
config.yourOption;  // 3
config.getDefault('yourOption');  // 1
config.nested.option;  // "three"
config.getPropRef('nested.option'); // "three" (same as above)
config.getDefault('nested.option');  // "two"
```

## Additional options
By default, arrays are replaced. For concatenation, pass additional option `{arrayBehavior: 1}` to `add`.
For more detail and other options, see [API docs](../../wiki).

```javascript
config.add({nested: {array: [3]}}, {}, { arrayBehavior: 1 });
config.nested.array;  // [2, 3]
```


## Use nconf (if needed)
Prepare `nconf` wrapper:
```javascript
const nconf = require('nconf');
const nc = require('./config');

let defaultConfig = nc.create({}, {some: "config"});

nconf
  .env()
  .argv()
  .defaults(defaultConfig);

// exports your current config
module.exports.nconf = nconf;  

// manipulate default config (e.g. add new options for embedded modules)
module.exports.defaults = defaultConfig;  
```

## Extras
The module exports two useful functions which it uses internally: `mergeDeep()` and `plainify()`.
See [API docs](../../wiki) for more information.

```javascript
const nc = require('nested-config');

let obj1 = {
    a: 1,
    nested: {
        arr: [1, 2]
    }
};

let obj2 = {
    a: 2,
    nested: {
        arr: [3],
        foo: 'bar'
    }
};

nc.mergeDeep(obj1, obj2, {arrayBehavior: 1});
/* obj1:
{ 
    a: 2, 
    nested: {
        arr: [1, 2, 3],
        foo: 'bar'
    }
}
*/

let obj3 = nc.plainify(obj2);
/* obj3:
{
    a: 2, 
    'nested.arr': [3],
    'nested.foo': 'bar'
}
*/
```

# JSDoc
API docs are available on the [wiki](../../wiki).

