/*jslint node, es6, maxlen: 80 */

"use strict";

module.exports = function makeLogger(callback) {
    return function log(original) {
        // eslint-disable-next-line fp/no-let
        let callCount = 0;

        // eslint-disable-next-line fp/no-rest-parameters
        return function callTheCallbackAndTheOriginal(...args) {
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
                            duration: process.hrtime(start)
                        }),
                        (error) => callTheCallback({
                            error,
                            duration: process.hrtime(start)
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
                    process.hrtime(start)
                );
            } catch (error) {
                handleError(
                    error,
                    process.hrtime(start)
                );
            }
        };
    };
};
