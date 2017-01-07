/*jslint node, es6, maxlen: 80 */
/*eslint func-names: "off" */

"use strict";

const mocha = require("mocha");
const chai = require("chai");

const functrace = require("../src");
const makeTracer = require("../src/tracer");

const {describe, it} = mocha;
const {expect} = chai;

describe("functrace", function () {
    it(
        "should be frozen",
        function () {
            return expect(functrace).to.be.frozen;
        }
    );

    it(
        "should have the makeTracer function",
        function () {
            return expect(functrace.makeTracer).to.eql(makeTracer);
        }
    );
});
