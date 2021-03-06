/**
 * Created by Roman Spiridonov <romars@phystech.edu> on 5/6/2017.
 */
"use strict";

const
    // Libraries
    expect = require('chai').expect,
    sinon = require('sinon');

let
    // Project modules
    nc = require('../index');

describe("Config", function() {
    let overrides = {};

    let defaults = {
        foo: 'bar',
        nested: {
            nested: {
                foo: 'bar',
                array: [1, 2]
            },
            foo: 'bar'
        },

        meta: {
            foo: {desc: 'Some description', type: 'string', alias: 'f'},
            nested: {
                foo: {desc: 'Some description', type: 'string'},
                nested: {
                    foo: 'Some description',
                    array: {desc: 'Some description', type: 'array', alias: 'a'}
                }
            }
        }
    };

    describe("Construction and initialization", function() {
        it("creates new config properly using constructor", function() {
            let config = nc.create(
              {
                  port: 8080,
                  formula: {
                      delims: ["<math>"],
                      output: "mml"
                  }
              },
              {
                  port: 8000,
                  delims: ["\\$\\$"],
                  formula: {
                      input: "TeX"
                  }
              });
            expect(config.port).to.equal(8080);
            expect(config._defaults.port).to.equal(8000);
            expect(config).to.have.property('formula').that.is.an('object');
            expect(config.formula.input).to.equal("TeX");
            expect(config.formula.output).to.equal("mml");
            expect(config.formula).to.have.property('delims').that.is.an('array')
            .that.deep.equals(["<math>"]);
        });
    });

    describe("add", function() {
        it("deeply extends config object with new options, overriding old values with new ones", function() {
            it("creates new config properly", function() {
                let config = nc.create({}, defaults);
                config.add(overrides);

                expect(config.port).to.equal(8080);
                expect(config._defaults.port).to.equal(8000);
                expect(config).to.have.property('formula').that.is.an('object').that.deep.equals({
                    input: "TeX",
                    output: "mml",
                    delims: ["<math>"]
                });
            });
        });

        it("supports merge options", function() {
            let config = nc.create({}, defaults);
            config.add({nested: {nested: {array: [3]}}}, {}, {arrayBehavior: 1});
            expect(config.nested.nested.array).to.eql([1, 2, 3]);
        });
    });

    describe("getPropRef", function() {
        it("returns target if the first parameter is null or empty string", function() {
            let config = nc.create(overrides, defaults);
            expect(config.getPropRef(null)).to.equal(config);
            expect(config.getPropRef('')).to.equal(config);
            let obj = {test: 'this'};
            expect(config.getPropRef('', obj)).to.equal(obj);
        });

        it("returns correct property based on reference string", function() {
            let config = nc.create(overrides, defaults);
            expect(config.getPropRef('nested.foo')).to.equal('bar');
            expect(config.getPropRef('nested', config.meta)).to.be.an('object')
            .that.eql(defaults.meta.nested);
            expect(config.getPropRef('nested.nested.array', config.meta)).to.eql(defaults.meta.nested.nested.array);
        });
    });

    describe("README.md test", function() {
        it("basic usage works", function() {
            let config = nc.create({a: 'new value'}, {a: 'default value'});
            expect(config.a).to.equal('new value');  // 'new value'
            expect(config.getDefault('a')).to.equal('default value');  // 'default value'

            config.add({b: 1}, {b: 0});  // overrides, defaults
            expect(config.b).to.equal(1);  // 1
            expect(config.getDefault('b')).to.equal(0);  // 0
        });

        it("advanced usage works", function() {
            let defaults = {
                yourOption: 1,
                nested: {
                    option: "two",
                    array: [1]
                }
            };

            let config = nc.create({yourOption: 2}, defaults);
            expect(config.yourOption).to.equal(2);  // 2
            expect(config.nested.array).to.eql([1]); // [1] (default)

            let overrides = {
                yourOption: 3,
                nested: {
                    option: "three",
                    array: [2]
                },
            };

            config.add(overrides, {});  // performs deep merge into current config state, leaves defaults unchanged
            expect(config.nested.array).to.eql([2]);  // [2]

            config.add({nested: {array: [3]}}, {}, {arrayBehavior: 1});
            expect(config.nested.array).to.eql([2, 3]);  // [2, 3]

            expect(config.yourOption).to.equal(3);  // 3
            expect(config.getDefault('yourOption')).to.equal(1);  // 1
            expect(config.nested.option).to.equal("three");  // "three"
            expect(config.getPropRef('nested.option')).to.equal("three"); // "three" (same as above)
            expect(config.getDefault('nested.option')).to.equal("two");  // "two"
        });

        it("extras work", function() {
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
            expect(obj1).to.eql({
                a: 2,
                nested: {
                    arr: [1, 2, 3],
                    foo: 'bar'
                }
            });

            let obj3 = nc.plainify(obj2);
            expect(obj3).to.eql({
                a: 2,
                'nested.arr': [3],
                'nested.foo': 'bar'
            });
        });

    });

    describe("Bug fixes", function() {
        it("does not have side effects when mutating defaults", function() {
            const defaults = {array: [[1, 2]]};
            let config = nc.create(defaults, defaults);
            config.array.push([3]);
            expect(config.array).to.eql([[1, 2], [3]]);
            expect(config._defaults.array).to.eql([[1, 2]]);
        });
    });
});
