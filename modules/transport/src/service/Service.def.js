$oop.postpone($transport, 'Service', function (ns, className, /**jQuery*/$) {
    "use strict";

    var base = $oop.Base,
        self = base.extend()
            .addTrait($event.Evented);

    /**
     * Creates a Service instance.
     * @name $transport.Service.create
     * @function
     * @param {$transport.Request} request
     * @returns {$transport.Service}
     */

    /**
     * The Service class represents a service associated with a specific request.
     * Implements an API to call the service in online or offline, asynchronous or synchronous modes.
     * Triggers events upon start, success, and failure of service calls.
     * TODO: Perhaps throttler could be class-level?
     * @class
     * @extends $oop.Base
     * @extends $event.Evented
     */
    $transport.Service = self
        .setEventSpace($event.eventSpace)
        .addConstants(/** @lends $transport.Service */{
            /**
             * Default timeout for service calls in [ms].
             * @constant
             */
            SERVICE_TIMEOUT: 30000,

            /**
             * @type {object}
             * @constant
             */
            defaultHttpStatuses: {
                GET   : 200,
                POST  : 201,
                PUT   : 200,
                DELETE: 204
            }
        })
        .addPrivateMethods(/** @lends $transport.Service# */{
            /**
             * @param {object} ajaxOptions
             * @returns {$utils.Promise}
             * @private
             */
            _ajaxProxy: function (ajaxOptions) {
                return $.ajax(ajaxOptions);
            },

            /**
             * Triggers service related events (start - success/failure).
             * @param {$utils.Promise} ajaxPromise
             * @returns {$utils.Promise}
             * @private
             */
            _triggerEvents: function (ajaxPromise) {
                var that = this,
                    request = this.request;

                // sending notification about starting the service
                this.spawnEvent($transport.EVENT_SERVICE_START)
                    .setRequest(request)
                    .triggerSync();

                // adding handlers
                ajaxPromise
                    .then(function (responseNode, textStatus, jqXHR) {
                        that.spawnEvent($transport.EVENT_SERVICE_SUCCESS)
                            .setRequest(request)
                            .setResponseNode(responseNode)
                            .setJqXhr(jqXHR)
                            .triggerSync();
                    },
                    function (jqXHR, textStatus, errorThrown) {
                        that.spawnEvent($transport.EVENT_SERVICE_FAILURE)
                            .setRequest(request)
                            .setResponseNode(errorThrown)
                            .setJqXhr(jqXHR)
                            .triggerSync();
                    });

                return ajaxPromise;
            },

            /**
             * @param {object} ajaxOptions
             * @returns {$utils.Promise}
             * @private
             */
            _callService: function (ajaxOptions) {
                var that = this,
                    request = this.request,
                    requestBody,
                    requestHeaders;

                switch (request.bodyFormat) {
                case 'json':
                    requestBody = JSON.stringify(request.params.items);
                    requestHeaders = request.headers.clone()
                        .setItem('Content-Type', 'application/json')
                        .items;
                    break;
                default:
                case 'default':
                    requestBody = request.params.items;
                    requestHeaders = request.headers.items;
                }

                // merging default ajax options with custom options
                // custom options taking precedence
                ajaxOptions = $data.Collection.create(ajaxOptions)
                    .mergeWith(this.ajaxOptions)
                    .mergeWith($data.Collection.create({
                        type   : request.httpMethod,
                        url    : request.getUrl(),
                        headers: requestHeaders,
                        data   : requestBody,
                        timeout: self.SERVICE_TIMEOUT
                    }))
                    .items;

                var promise = $transport.PromiseLoop
                    .retryOnFail(function () {
                        var deferred = $utils.Deferred.create();
                        that._ajaxProxy(ajaxOptions)
                            .done(deferred.resolve.bind(deferred))
                            .fail(deferred.reject.bind(deferred));
                        return deferred.promise;
                    }, this.retryCount, this.retryDelay)
                    .then(null, null, function (stop, jqXHR, textStatus, errorThrown) {
                        that.spawnEvent($transport.EVENT_SERVICE_RETRY)
                            .setRequest(request)
                            .setResponseNode(errorThrown)
                            .setJqXhr(jqXHR)
                            .setPayloadItem('stop', stop)
                            .triggerSync();
                    });

                this._triggerEvents(promise);

                return promise;
            }
        })
        .addMethods(/** @lends $transport.Service# */{
            /**
             * @param {$transport.Request} request
             * @ignore
             */
            init: function (request) {
                $assertion.isRequest(request, "Invalid request");

                $event.Evented.init.call(this);

                this.elevateMethods(
                    '_ajaxProxy',
                    '_callService');

                /**
                 * Request associated with the service call.
                 * @type {$transport.Request}
                 */
                this.request = request;

                /**
                 * Number of times a failed service will be re-attempted.
                 * @type {number}
                 */
                this.retryCount = 0;

                /**
                 * Number of milliseconds between retries.
                 * @type {number}
                 */
                this.retryDelay = 1000;

                /**
                 * Custom options to be passed to jQuery.ajax().
                 * Options stored in here override the default ajax options, and thus might break the ajax call.
                 * @type {$data.Collection}
                 */
                this.ajaxOptions = $data.Collection.create();

                /** @type {$transport.MultiThrottler} */
                this.callServiceThrottler = this._callService.toMultiThrottler();

                // setting event path to endpoint's event path
                this.setEventPath(request.endpoint.eventPath);
            },

            /**
             * Sets how many times a failed service call will be re-attempted.
             * @param {number} retryCount
             * @returns {$transport.Service}
             */
            setRetryCount: function (retryCount) {
                $assertion.isNumber(retryCount, "Invalid retry count");
                this.retryCount = retryCount;
                return this;
            },

            /**
             * Sets delay in milliseconds between consecutive attempts.
             * @param {number} retryDelay
             * @returns {$transport.Service}
             */
            setRetryDelay: function (retryDelay) {
                $assertion.isNumber(retryDelay, "Invalid retry count");
                this.retryDelay = retryDelay;
                return this;
            },

            /**
             * Sets custom ajax option key-value pair. Overwrites existing option entry by the same `optionName`.
             * @param {string} optionName
             * @param {*} optionValue
             * @returns {$transport.Service}
             */
            setAjaxOption: function (optionName, optionValue) {
                $assertion.isString(optionName, "Invalid ajax option name");
                this.ajaxOptions.setItem(optionName, optionValue);
                return this;
            },

            /**
             * Sets multiple custom ajax option key-value pairs. Overwrites existing ajax option entries
             * having the same keys.
             * @param {object} ajaxOptions
             * @returns {$transport.Service}
             */
            addAjaxOptions: function (ajaxOptions) {
                $assertion.isObject(ajaxOptions, "Invalid ajax options");

                var that = this;

                $data.Collection.create(ajaxOptions)
                    .forEachItem(function (value, key) {
                        that.ajaxOptions.setItem(key, value);
                    });

                return this;
            },

            /**
             * Calls service in offline mode, that will return with success, carrying the specified response body.
             * Offline service calls behave exactly like online calls except they don't make any ajax requests.
             * @example
             * service.callOfflineServiceWithSuccess({foo: 'bar'});
             * @param {*} responseNode Response body to be returned.
             * @param {number} [httpStatus] HTTP status code for the response.
             * @returns {$utils.Promise}
             */
            callOfflineServiceWithSuccess: function (responseNode, httpStatus) {
                httpStatus = httpStatus || // whet the user specified
                    this.defaultHttpStatuses[this.request.httpMethod] || // or a known default value
                    200; // or 200

                var deferred = $utils.Deferred.create();

                // making sure service call will be async, just like a real ajax call
                setTimeout(function () {
                    deferred.resolve(responseNode, null, {status: httpStatus});
                }, 0);

                return this._triggerEvents(deferred.promise);
            },

            /**
             * Calls service in offline mode, that will return with failure, carrying the specified error value.
             * Offline service calls behave exactly like online calls except they don't make any ajax requests.
             * @param {*} errorThrown Error value to be returned.
             * @param {number} [httpStatus] HTTP status code for the response.
             * @returns {$utils.Promise}
             */
            callOfflineServiceWithFailure: function (errorThrown, httpStatus) {
                httpStatus = httpStatus || 400;

                var deferred = $utils.Deferred.create();

                // making sure service call will be async, just like a real ajax call
                setTimeout(function () {
                    deferred.reject({status: httpStatus}, null, errorThrown);
                }, 0);

                return this._triggerEvents(deferred.promise);
            },

            /**
             * Calls service in online mode, dispatching an ajax request in the end. No ajax request will be made
             * if an identical service call is currently in progress.
             * @param {object} [ajaxOptions] Custom options for jQuery ajax.
             * In case of conflict, custom option overrides default.
             * @returns {$utils.Promise}
             */
            callService: function (ajaxOptions) {
                $assertion.isObjectOptional(ajaxOptions, "Invalid ajax options");

                var request = this.request,
                    requestId = request.toString();

                return this.callServiceThrottler
                    .runThrottled(requestId, ajaxOptions);
            },

            /**
             * Calls service in offline mode, synchronously, that will return with success, carrying the specified response body.
             * Offline service calls behave exactly like online calls except they don't make any ajax requests.
             * @example
             * service.callOfflineServiceWithSuccessSync({foo: 'bar'});
             * @param {*} responseNode Response body to be returned.
             * @returns {$utils.Promise}
             */
            callOfflineServiceWithSuccessSync: function (responseNode) {
                return this._triggerEvents($utils.Deferred.create().resolve(responseNode, null, null).promise);
            },

            /**
             * Calls service in offline mode, synchronously, that will return with failure, carrying the specified error value.
             * Offline service calls behave exactly like online calls except they don't make any ajax requests.
             * @param {*} errorThrown Error value to be returned.
             * @returns {$utils.Promise}
             */
            callOfflineServiceWithFailureSync: function (errorThrown) {
                return this._triggerEvents($utils.Deferred.create().reject(null, null, errorThrown).promise);
            },

            /**
             * Calls service synchronously. Overrides `async` option passed in `ajaxOptions`.
             * @example
             * // loading static JSON file
             * 'files/data.json'.toRequest().toService().callServiceSync();
             * @param {object} [ajaxOptions] Custom options for jQuery ajax.
             * @returns {$utils.Promise}
             */
            callServiceSync: function (ajaxOptions) {
                ajaxOptions = $data.Collection.create({async: false})
                    .mergeWith($data.Collection.create(ajaxOptions))
                    .items;

                return this.callService(ajaxOptions);
            }
        });
}, jQuery);

(function () {
    "use strict";

    $oop.addGlobalConstants.call($transport, /** @lends $transport */{
        /**
         * Signals the start of a Service call.
         * @constant
         */
        EVENT_SERVICE_START: 'service.start',

        /**
         * Signals that a Service call was attempted after failure.
         * @constant
         */
        EVENT_SERVICE_RETRY: 'service.retry',

        /**
         * Signals the successful return of a Service call.
         * @constant
         */
        EVENT_SERVICE_SUCCESS: 'service.success',

        /**
         * Signals a failed Service call. The reason for failure is included in the event.
         * @constant
         */
        EVENT_SERVICE_FAILURE: 'service.failure'
    });
}());

$oop.amendPostponed($transport, 'Request', function () {
    "use strict";

    $transport.Request
        .addMethods(/** @lends $transport.Request */{
            /** @returns {$transport.Service} */
            toService: function () {
                return $transport.Service.create(this);
            }
        });
});

$oop.postpone($transport, 'logServiceEvents', function () {
    "use strict";

    /**
     * Starts logging all service related events to the console.
     * @type {function}
     */
    $transport.logServiceEvents = function () {
        [].toEndpoint()
            .subscribeTo($transport.EVENT_SERVICE_START, function (event) {
                console.info("service start", event.request.endpoint.toString(), event);
            })
            .subscribeTo($transport.EVENT_SERVICE_RETRY, function (event) {
                console.warn("service retry", event.request.endpoint.toString(), event);
            })
            .subscribeTo($transport.EVENT_SERVICE_SUCCESS, function (event) {
                console.info("service success", event.request.endpoint.toString(), event);
            })
            .subscribeTo($transport.EVENT_SERVICE_FAILURE, function (event) {
                console.warn("service failed", event.request.endpoint.toString(), event);
            });
    };
});
