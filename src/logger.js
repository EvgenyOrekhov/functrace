/*jslint node, es6, maxlen: 80 */
/*eslint promise/no-callback-in-promise: "off" */

"use strict";

const prettyHrtime = require("pretty-hrtime");

function getDuration(start) {
    const end = process.hrtime(start);

    return prettyHrtime(end);
}

module.exports = function makeLogger(callback) {
    return function log(original) {
        // eslint-disable-next-line fp/no-let
        let callCount = 0;

        // eslint-disable-next-line fp/no-rest-parameters
        return function callTheCallbackAndTheOriginal(...args) {
            const partialInfo = {
                name: original.name,
                args
            };
            const start = process.hrtime();

            function handleReturnValue(returnValue, duration) {
                if (
                    returnValue !== undefined
                    && typeof returnValue.then === "function"
                ) {
                    // eslint-disable-next-line promise/catch-or-return
                    returnValue.then(
                        // eslint-disable-next-line promise/always-return
                        function callTheCallback(fulfillmentValue) {
                            const info = Object.assign({}, partialInfo, {
                                fulfillmentValue,
                                duration: getDuration(start),
                                callCount
                            });

                            callback(info);
                        },
                        function callTheCallback(error) {
                            const info = Object.assign({}, partialInfo, {
                                error,
                                duration: getDuration(start),
                                callCount
                            });

                            callback(info);
                        }
                    );

                    return returnValue;
                }

                const info = Object.assign({}, partialInfo, {
                    returnValue,
                    duration,
                    callCount
                });

                callback(info);

                return returnValue;
            }

            function handleError(error, duration) {
                const info = Object.assign({}, partialInfo, {
                    error,
                    duration,
                    callCount
                });

                // eslint-disable-next-line callback-return
                callback(info);

                // eslint-disable-next-line fp/no-throw
                throw error;
            }

            // eslint-disable-next-line fp/no-mutation, no-magic-numbers
            callCount += 1;

            try {
                return handleReturnValue(
                    original(...args),
                    getDuration(start)
                );
            } catch (error) {
                handleError(
                    error,
                    getDuration(start)
                );
            }
        };
    };
};
