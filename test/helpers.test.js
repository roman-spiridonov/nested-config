/**
 * Created by Roman Spiridonov <romars@phystech.edu> on 5/12/2017.
 */
"use strict";

const
  // Libraries
  expect = require('chai').expect,
  sinon = require('sinon');

let
  // Project modules
  helpers = require('../helpers');

describe("Helpers", function () {
    describe("plainify", function () {
        it("does not mutate an object", function () {
            let testObj = {foo: 'bar', someKey: true, someArray: [1, 2]};
            helpers.plainify(testObj);
            expect(testObj).to.eql({foo: 'bar', someKey: true, someArray: [1, 2]});
        });

        it("makes nested object a plain object with nested keys written as some.nested.key = value", function () {
            let testObj = {nested: {foo: 'bar', nested: {foo: [1, 2]}}, foo: 'bar'};
            let res = helpers.plainify(testObj);
            expect(res).to.eql({
                'nested.foo': 'bar',
                'nested.nested.foo': [1, 2],
                'foo': 'bar'
            });
            expect(res).to.not.equal(testObj);
        });

        it("does not plainify nested objects that satisfy a condition passed as a second parameter", function () {
            let testObj = {
                key: {desc: "description", type: "number", default: 5},
                nested: {key: {desc: "description", type: "boolean", default: true}, foo: 'bar', plainKey: {type: "boolean"}}
            };
            let res = helpers.plainify(testObj, (prop) => {
                return !!(prop.desc && prop.type);
            });
            expect(res).to.eql({
                'nested.foo': 'bar',
                'nested.plainKey.type': 'boolean',
                'nested.key': {desc: "description", type: "boolean", default: true},
                'key': {desc: "description", type: "number", default: 5}
            });
            expect(res).to.not.equal(testObj);
        });
    });

    describe("mergeDeep", function () {
        it("merges deeply nested objects and mutates the source object", function () {
            let testObj = {a: 1, nested: {nested: {foo: 'bar'}, foo: 'bar'}};
            let mergedObj = {a: 2, b: 1, nested: {foo: 'new bar', nested: {newfoo: 'bar'}}};
            let res = helpers.mergeDeep(testObj, mergedObj);
            expect(res).to.equal(testObj);
            expect(testObj).to.eql({
                a: 2,
                b: 1,
                nested: {foo: 'new bar', nested: {foo: 'bar', newfoo: 'bar'}}
            });
        });

        it("can skip copying properties which are undefined on target by calling proper callback", function () {
            let testObj = {a: 1, nested: {nested: {foo: 'bar'}, foo: 'bar'}};
            let mergedObj = {a: 2, b: 1, nested: {foo: 'new bar', nested: {newfoo: 'bar'}}};
            helpers.mergeDeep(testObj, mergedObj, {
                skipFunc: (targetProp) => (targetProp === undefined)
            });
            // new props should not be created - only existing props are to be updated
            expect(testObj).to.eql({
                a: 2,
                nested: {foo: 'new bar', nested: {foo: 'bar'}},
            });
        });

        it("deep copies and replaces arrays", function() {
            let testObj = {array: [1]};
            let mergedObj = {array: [2]};

            helpers.mergeDeep(testObj, mergedObj);

            expect(testObj.array).eql([2]);
            expect(testObj.array).to.not.equal(mergedObj.array);  // deep copy?
        });

        it("mutates only the first object in the chain of objects", function() {
            let obj1 = {a: 1};
            let obj2 = {a: 2};
            let obj3 = {a: 3};

            helpers.mergeDeep(obj1, obj2, obj3);

            expect(obj1).to.eql({a: 3});
            expect(obj2).to.eql({a: 2});
        });
        it("creates a deep copy if mutate option is passed", function() {
            let obj1 = {a: 1};
            let obj2 = {a: 2, nested: {arr: [2], b: 2}};
            let obj3 = {a: 3, nested: {arr: [3], b: null}};

            let obj4 = helpers.mergeDeep(obj1, obj2, obj3, { mutate: false });

            expect(obj1).to.eql({a: 1});
            expect(obj2).to.eql({a: 2, nested: {arr: [2], b: 2}});
            expect(obj3).to.eql({a: 3, nested: {arr: [3], b: null}});
            expect(obj4).to.eql(obj3);
            expect(obj4).to.not.equal(obj3);
        });

        it("arrayBehavior === 0 creates full copy of an array", function() {
            let obj1 = {};
            let obj2 = {a: [1, 2]};
            helpers.mergeDeep(obj1, obj2, {arrayBehavior: 0});
            expect(obj1).to.eql({a: [1, 2]});
            expect(obj1.a).to.not.equal(obj2.a);
            obj1.a.push(3);
            expect(obj1.a).to.eql([1, 2, 3]);
            expect(obj2.a).to.eql([1, 2]);
        });
        it("arrayBehavior === 1 appends to an array", function() {
            let obj1 = {a: [1]};
            let obj2 = {a: [1, 2]};
            helpers.mergeDeep(obj1, obj2, {arrayBehavior: 1});
            expect(obj1).to.eql({a: [1, 1, 2]});
            expect(obj1.a).to.not.equal(obj2.a);
            obj1.a.push(3);
            expect(obj1.a).to.eql([1, 1, 2, 3]);
            expect(obj2.a).to.eql([1, 2]);
        });
        it("arrayBehavior === 1 works correctly when no array is in target[key]", function() {
            let obj1 = {a: 1};
            let obj2 = {a: 2, nested: {arr: [2], b: 3} };
            let obj3 = {a: 3, nested: {arr: [3]}};

            helpers.mergeDeep(obj1, obj2, obj3, {arrayBehavior: 1});

            expect(obj1).to.eql({a: 3, nested: {arr: [2, 3], b: 3}});
        });
        it("arrayBehavior === 0 creates shallow copy of an array", function() {
            let obj1 = {};
            let obj2 = {a: [1, 2]};
            helpers.mergeDeep(obj1, obj2, {arrayBehavior: 2});
            expect(obj1).to.eql({a: [1, 2]});
            expect(obj1.a).to.equal(obj2.a);
            obj1.a.push(3);
            expect(obj1.a).to.eql([1, 2, 3]);
            expect(obj2.a).to.eql([1, 2, 3]);
        });
    });
});
