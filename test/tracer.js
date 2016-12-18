/*jslint node, es6, maxlen: 80 */
/*eslint func-names: "off", no-magic-numbers: "off" */

"use strict";

const mocha = require("mocha");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const chaiSpies = require("chai-spies");

const makeTracer = require("../src/tracer");

const describe = mocha.describe;
const it = mocha.it;
const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(chaiSpies);

const error = new Error("error message");

function original(arg) {
    return arg;
}

function originalThrow() {
    // eslint-disable-next-line fp/no-throw
    throw error;
}

function originalAsync(timeout) {
    // eslint-disable-next-line promise/avoid-new
    return new Promise(function executor(resolve) {
        setTimeout(() => resolve(timeout), timeout);
    });
}

function originalAsyncReject() {
    return Promise.reject(error);
}

describe("tracer", function () {
    it(
        "should wrap the passed in function",
        function () {
            const trace = makeTracer(original);
            const wrapped = trace(original);

            return expect(wrapped("test")).to.eql(original("test"));
        }
    );

    it(
        "should report the name of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.name).to.eql(original.name)
            );
            const trace = makeTracer(callback);
            const wrapped = trace(original);

            wrapped();

            return expect(callback).to.have.been.called.exactly(1);
        }
    );

    it(
        "should report the arguments of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.args).to.eql(["test"])
            );
            const trace = makeTracer(callback);
            const wrapped = trace(original);

            wrapped("test");

            return expect(callback).to.have.been.called.exactly(1);
        }
    );

    it(
        "should report the return value of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.returnValue).to.eql("test")
            );
            const trace = makeTracer(callback);
            const wrapped = trace(original);

            wrapped("test");

            return expect(callback).to.have.been.called.exactly(1);
        }
    );

    it(
        "should report the duration of the call of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.duration).to.include("s")
            );
            const trace = makeTracer(callback);
            const wrapped = trace(original);

            wrapped();

            return expect(callback).to.have.been.called.exactly(1);
        }
    );

    it(
        "should report errors of the passed in function",
        function () {
            const callback = chai.spy(
                (result) => expect(result.error).to.eql(error)
            );
            const trace = makeTracer(callback);
            const wrapped = trace(originalThrow);

            try {
                wrapped();
            } catch (caughtError) {
                expect(caughtError).to.eql(error);
                expect(callback).to.have.been.called.exactly(1);
            }
        }
    );

    it(
        "should report the call count of the passed in function",
        function () {
            // eslint-disable-next-line fp/no-let
            let callCount = 0;
            const callback = chai.spy(function (result) {
                // eslint-disable-next-line fp/no-mutation
                callCount += 1;
                expect(result.callCount).to.eql(callCount);
            });
            const trace = makeTracer(callback);
            const wrapped = trace(original);

            wrapped();
            wrapped();

            return expect(callback).to.have.been.called.exactly(2);
        }
    );

    /* eslint-disable no-console, fp/no-mutation */

    it(
        "should use console.log if the callback is not provided",
        function () {
            const originalConsoleLog = console.log;

            console.log = chai.spy();

            const trace = makeTracer();
            const wrapped = trace(original);

            wrapped();

            expect(console.log).to.have.been.called.exactly(1);

            console.log = originalConsoleLog;
        }
    );

    /* eslint-enable no-console, fp/no-mutation */

    describe("promises", function () {
        it(
            "should wrap functions that return promises",
            function () {
                const timeout = 0;
                const trace = makeTracer(original);
                const wrapped = trace(originalAsync);

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
                const trace = makeTracer(callback);
                const wrapped = trace(originalAsync);

                return wrapped(timeout).then(
                    () => expect(callback).to.have.been.called.exactly(1)
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
                const trace = makeTracer(callback);
                const wrapped = trace(originalAsyncReject);

                return wrapped().catch(
                    () => expect(callback).to.have.been.called.exactly(1)
                );
            }
        );

        it(
            "should work with functions that return promises and report their "
                    + "names, args and durations",
            function (done) {
                const timeout = 10;
                const callback = chai.spy(function (result) {
                    expect(result.name).to.eql(originalAsync.name);
                    expect(result.args).to.eql([timeout]);
                    expect(result.duration).to.match(/1\d\sms/);

                    done();
                });
                const trace = makeTracer(callback);
                const wrapped = trace(originalAsync);

                // eslint-disable-next-line promise/catch-or-return
                wrapped(timeout).then(
                    () => expect(callback).to.have.been.called.exactly(1)
                );
            }
        );
    });
});
