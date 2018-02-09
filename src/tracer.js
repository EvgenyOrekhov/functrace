/*jslint node, maxlen: 80 */

"use strict";

const prettyHrtime = require("pretty-hrtime");

function getDuration(start) {
    const end = process.hrtime(start);

    return prettyHrtime(end);
}

// eslint-disable-next-line no-console
module.exports = function makeTracer(callback = console.log) {
    return function trace(original) {
        // eslint-disable-next-line fp/no-let
        let callCount = 0;

        // eslint-disable-next-line fp/no-rest-parameters
        function callTheCallbackAndTheOriginal(...args) {
            const start = process.hrtime();

            function callTheCallback(info) {
                const allInfo = Object.assign(
                    {
                        name: original.name,
                        args,
                        callCount
                    },
                    info
                );

                callback(allInfo);
            }

            function handleReturnValue(returnValue, duration) {
                if (
                    returnValue !== undefined
                    && typeof returnValue.then === "function"
                ) {
                    // eslint-disable-next-line promise/catch-or-return
                    returnValue.then(
                        (fulfillmentValue) => callTheCallback({
                            fulfillmentValue,
                            duration: getDuration(start)
                        }),
                        (error) => callTheCallback({
                            error,
                            duration: getDuration(start)
                        })
                    );

                    return returnValue;
                }

                callTheCallback({
                    returnValue,
                    duration
                });

                return returnValue;
            }

            function handleError(error, duration) {
                callTheCallback({
                    error,
                    duration
                });

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
        }

        // eslint-disable-next-line fp/no-mutating-methods
        Object.defineProperty(
            callTheCallbackAndTheOriginal,
            "length",
            {value: original.length}
        );

        return callTheCallbackAndTheOriginal;
    };
};
