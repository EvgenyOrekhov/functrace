/*jslint node, es6, maxlen: 80 */
/*eslint func-names: "off" */

"use strict";

const mocha = require("mocha");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const chaiSpies = require("chai-spies");

const makeLogger = require("../src/logger");

const describe = mocha.describe;
const it = mocha.it;
const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(chaiSpies);

const once = 1;

function original(arg) {
    return arg;
}

function originalAsync(timeout) {
    // eslint-disable-next-line promise/avoid-new
    return new Promise(function executor(resolve) {
        setTimeout(() => resolve(timeout), timeout);
    });
}

const error = new Error("error message");

function originalAsyncReject() {
    return Promise.reject(error);
}

describe("logger", function () {
    it(
        "should wrap the passed in function",
        function () {
            const log = makeLogger(original);
            const wrapped = log(original);

            return expect(wrapped("test")).to.eql(original("test"));
        }
    );

    it(
        "should report the name of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.name).to.eql(original.name)
            );
            const log = makeLogger(callback);
            const wrapped = log(original);

            wrapped();

            return expect(callback).to.have.been.called.exactly(once);
        }
    );

    it(
        "should report the arguments of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.args).to.eql(["test"])
            );
            const log = makeLogger(callback);
            const wrapped = log(original);

            wrapped("test");

            return expect(callback).to.have.been.called.exactly(once);
        }
    );

    it(
        "should report the return value of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.returnValue).to.eql("test")
            );
            const log = makeLogger(callback);
            const wrapped = log(original);

            wrapped("test");

            return expect(callback).to.have.been.called.exactly(once);
        }
    );

    it(
        "should report the duration of the call of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.duration).to.include("s")
            );
            const log = makeLogger(callback);
            const wrapped = log(original);

            wrapped();

            return expect(callback).to.have.been.called.exactly(once);
        }
    );

    describe("promises", function () {
        it(
            "should wrap functions that return promises",
            function () {
                const timeout = 0;
                const log = makeLogger(original);
                const wrapped = log(originalAsync);

                return expect(wrapped(timeout)).to.eventually.eql(timeout);
            }
        );

        it(
            "should work with functions that return promises and report their "
                    + "fulfillment values",
            function () {
                const timeout = 0;
                const callback = chai.spy(
                    (result) => expect(result.fulfillmentValue).to.eql(timeout)
                );
                const log = makeLogger(callback);
                const wrapped = log(originalAsync);

                return wrapped(timeout).then(
                    () => expect(callback).to.have.been.called.exactly(once)
                );
            }
        );

        it(
            "should work with functions that return promises and report their "
                    + "errors",
            function () {
                const callback = chai.spy(
                    (result) => expect(result.error).to.eql(error)
                );
                const log = makeLogger(callback);
                const wrapped = log(originalAsyncReject);

                return wrapped().catch(
                    () => expect(callback).to.have.been.called.exactly(once)
                );
            }
        );

        it(
            "should work with functions that return promises and report their "
                    + "names, args and durations",
            function () {
                const timeout = 10;
                const callback = chai.spy(function (result) {
                    expect(result.name).to.eql(originalAsync.name);
                    expect(result.args).to.eql([timeout]);
                    expect(result.duration).to.match(/1\d\sms/);
                });
                const log = makeLogger(callback);
                const wrapped = log(originalAsync);

                return wrapped(timeout).then(
                    () => expect(callback).to.have.been.called.exactly(once)
                );
            }
        );
    });
});
