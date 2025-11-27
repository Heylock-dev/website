import { record } from '@rrweb/record';

class Heylock {
    userUUID = null;
    sessionUUID = null;

    _apiKey = null;
    _isBrowserEnvironment = typeof window !== 'undefined';
    _hasInitializationStarted = false;
    // Scroll
    _lastScrollCheck = Date.now();
    _scrollMilestone = 0;
    _milestones = [10, 25, 50, 75, 97];
    // Replay
    _eventsBuffer = [];
    _isRecordingReplay = false;

    __lastPulse = null;
    get _lastPulse() {
        if(this.__lastPulse !== null){
            return this.__lastPulse;
        } else if(this._isBrowserEnvironment) {
            const operationalLastPulse = window.localStorage.getItem('heylock_last_pulse');
            
            if (operationalLastPulse !== undefined && operationalLastPulse !== null) {
                this.__lastPulse = operationalLastPulse;
                
                return operationalLastPulse;
            }
        } else {
            return null;
        }
    }
    set _lastPulse(value) {
        this._isBrowserEnvironment && window.localStorage.setItem('heylock_last_pulse', value);

        this.__lastPulse = value;
    }

    async initialize(apiKey, { requireBrowserEnvironment = false, enableAutoCapture = true, enableReplayCapture = true, tags }) {
        return; // TEMPORARY DISABLE SDK INITIALIZATION (DEV ONLY)

        this._apiKey = apiKey;        

        if (requireBrowserEnvironment && !this._isBrowserEnvironment) return;
        
        if (this._hasInitializationStarted) return;
        this._hasInitializationStarted = true;
        
        this.userUUID = await this._requestAndStoreUserUUID();
        this.sessionUUID = await this._requestAndStoreSessionUUID(this.userUUID, tags);        
        
        enableReplayCapture && this._startReplayCapture();
        enableAutoCapture && this._startAutoCapture();

        // Before Unload
        window.addEventListener('beforeunload', () => {
            this._lastPulse = Date.now();
            
            navigator.sendBeacon(`http://localhost:3000/api/end-session`, JSON.stringify({ 
                sessionUUID: this.sessionUUID, 
                replayEvents: this._eventsBuffer,
                hasBeenRecordingReplay: this._isRecordingReplay,
                apiKey: this._apiKey
            }));
        });
    }

    async _requestAndStoreUserUUID() {
        // Return userUUID if it's valid
        if (typeof this.userUUID === 'string' && this.userUUID?.length !== 0) {
            return this.userUUID;
        }

        // Check if we already have the identifier stored in localStorage
        if (this._isBrowserEnvironment) {
            const storedUserUUID = window.localStorage.getItem('heylock_user_uuid');
            
            if(typeof storedUserUUID === 'string' && storedUserUUID.length !== 0){
                return storedUserUUID;
            }
        }
        
        // If not found, request a new identifier from the backend
        const response = await fetch('http://localhost:3000/api/generate-user-uuid', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this._apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate user uuid');
        }

        const data = await response.json();
        this._isBrowserEnvironment && window.localStorage.setItem('heylock_user_uuid', data.uuid);

        return data.uuid;
    }

    async _requestAndStoreSessionUUID(userUUID, tags) {
        if (Date.now() - this._lastPulse < 1000 * 60 * 5) { // If the last pulse was fired within 5 minutes
            const storedSessionUUID = window.localStorage.getItem('heylock_last_session_uuid');

            if (typeof storedSessionUUID === 'string') return storedSessionUUID;
        }

        const query = `?userUUID=${userUUID}${tags && `&tags=${encodeURIComponent(JSON.stringify(tags))}`}`;

        const response = await fetch(`http://localhost:3000/api/generate-session-uuid${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this._apiKey}`
            }
        });

        this._lastPulse = Date.now();

        if (!response.ok) {
            throw new Error('Failed to generate session uuid');
        }

        const data = await response.json();

        this._isBrowserEnvironment && window.localStorage.setItem('heylock_last_session_uuid', data.uuid);

        return data.uuid;
    }

    async _startAutoCapture() {
        if (this._isBrowserEnvironment === false) return;
        
        // Clicks
        document.addEventListener('click', event => {
            // Set of meaningful tags
            const clickableTags = [
                'A', 'BUTTON', 'INPUT', 'LABEL', 'SELECT', 'TEXTAREA',
                'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P',
                'DIALOG', 'OPTION', 'LEGEND', 'LI', 'FORM'
            ];

            // Save original target
            let element = event.target;
            let found = false; // In use

            // Walk up tree looking for clickable ancestor
            let walkerElement = element;
            while (walkerElement && !clickableTags.includes(walkerElement.tagName) && walkerElement.parentElement) {
                walkerElement = walkerElement.parentElement;
            }

            if (walkerElement && clickableTags.includes(walkerElement.tagName)) {
                element = walkerElement;
                found = true;
            }

            const elementType = element ? element.tagName : null;
            if (!clickableTags.includes(elementType)) return; // Ignore non-meaningful tags

            // Extract visible text content (deep, whitespace-collapsed)
            function extractText(elementForExtraction) {
                if (!elementForExtraction) return '';
                return elementForExtraction.innerText ? elementForExtraction.innerText.trim()
                    : elementForExtraction.textContent ? elementForExtraction.textContent.trim()
                    : '';
            }
            const elementText = extractText(element);

            // Extract attributes
            const ariaLabel = element && element.getAttribute('aria-label');
            const dataAttributes = {};
            if (element) {
                Array.from(element.attributes).forEach(attribute => {
                    if (attribute.name.startsWith('data-')) {
                        dataAttributes[attribute.name] = attribute.value;
                    }
                });
            }
            
            const uri = element.baseURI;

            const eventData = {
                type: 'Click',
                payload: JSON.stringify({
                    elementType,
                    identifier: elementText ? elementText : ariaLabel ? ariaLabel : dataAttributes ? dataAttributes : null,
                    x: typeof event.pageX === 'number' ? event.pageX : null,
                    y: typeof event.pageY === 'number' ? event.pageY : null,
                }),
                uri
            }

            this.captureEvent(eventData.type, eventData.payload, eventData.uri);
        });

        // PageViews (SPA)
        ['pushState', 'replaceState'].forEach(function(method) {
            const original = history[method];
            history[method] = function() {
                original.apply(history, arguments);
                
                 const eventData = {
                    type: 'PageView',
                    payload: JSON.stringify({
                        title: document.title
                    }),
                    uri: window.location.href
                };
                
                this.captureEvent(eventData.type, eventData.payload, eventData.uri);
            }.bind(this);
        }, this);

        // Errors
        window.onunhandledrejection = (event) => {
            const errorData = {
                type: 'Error',
                payload: JSON.stringify({
                    message: event.reason ? event.reason.message || event.reason.toString() : null,
                }),
                uri: window.location.href
            };

            this.captureEvent(errorData.type, errorData.payload, errorData.uri);
        };

        // Scrolls
        window.addEventListener('scroll', () => {
            // Throttle
            if(Date.now() - this._lastScrollCheck < 1000 * 2) return;
            this._lastScrollCheck = Date.now();

            const scrollY = window.scrollY;
            const pageHeight = document.body.scrollHeight - window.innerHeight;
            if(pageHeight < 0 || scrollY < 0) return;
            const scrollPercentage = Math.round((scrollY / pageHeight) * 100);

            this._milestones.forEach(milestone => {
                if(scrollPercentage > milestone && scrollPercentage > this._scrollMilestone) {
                    this._scrollMilestone = scrollPercentage;

                    this._milestones = this._milestones.filter((milestone) => milestone > scrollPercentage);
    
                    const scrollData = {
                        type: 'Scroll',
                        payload: JSON.stringify({
                            percentage: scrollPercentage,
                        }),
                        uri: window.location.href,
                    };

                    this.captureEvent(scrollData.type, scrollData.payload, scrollData.uri);
                }
            });
        });
    }

    async _startReplayCapture() {
        record({
            emit: (event) => {
                this._eventsBuffer.push(event);
            },
            sampling: {
                mouseInteraction: {
                    MouseUp: false,
                    MouseDown: false,
                    Click: true,
                    ContextMenu: false,
                    DblClick: true,
                    Focus: true,
                    Blur: true,
                    TouchStart: true,
                    TouchEnd: true,
                },
                // record mouse movement
                mousemove: true,
                // do not record mouse interaction
                mouseInteraction: false,
                // set the interval of scrolling event
                scroll: 150, // do not emit twice in 150ms
                // set the interval of media interaction event
                media: 800,
                // set the timing of record input
                input: 'last' // When input mulitple characters, only record the final input
            },
            slimDOMOptions: {
                script: false,
                comment: false,
                headFavicon: false,
                headWhitespace: false,
                headMetaDescKeywords: false,
                headMetaSocial: false,
                headMetaRobots: false,
                headMetaHttpEquiv: false,
                headMetaAuthorship: false,
                headMetaVerification: false
            }
        });

        this._isRecordingReplay = true;

        const clearInterval = setInterval(async () => {
            if(this._eventsBuffer.length < 10) return;

            try {
                const response = await fetch(`http://localhost:3000/api/append-replay-events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._apiKey}`
                    },
                    body: JSON.stringify({ sessionUUID: this.sessionUUID, events: this._eventsBuffer })
                });
        
                this._lastPulse = Date.now();
        
                if (!response.ok) {
                    clearInterval();
                    throw new Error('Failed to send replay events');
                } else {
                    this._eventsBuffer = [];
                }
            } catch (error) {
                console.warn(error);
            }
        }, 20000);
    }

    async captureEvent(type, payload, uri) {
        if(this.sessionUUID === null) console.warn("Unable to capture event. Waiting for initialization.");
        while(this.sessionUUID === null) await new Promise(resolve => setTimeout(resolve, 50));

        if (typeof type !== 'string' || type?.length === 0) {
            throw new Error('"type" must be a non-empty string');
        }

        var isPayloadEffective = Boolean(payload);
        if (payload && (typeof payload !== 'string' || payload.length > 500)) {
            isPayloadEffective = false;
            
            console.warn('"payload" must be a <500 characters string');
        }

        if(uri && (typeof uri !== 'string' || uri.length > 500)) {
            throw new Error('"uri" must be a <500 characters string');
        }

        try {
            const response = await fetch(`http://localhost:3000/api/capture-event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._apiKey}`
                },
                body: JSON.stringify({ sessionUUID: this.sessionUUID, type, payload: isPayloadEffective ? payload : null, uri })
            });
    
            this._lastPulse = Date.now();
    
            if (!response.ok) {
                throw new Error('Failed to capture event');
            }
        } catch (error) {
            console.warn(error);
        }
    }

    async updateMetric(name, { delta, value, reason, uri }) {
        if(this.sessionUUID === null) console.warn("Unable to update metric. Waiting for initialization.");
        while(this.sessionUUID === null) await new Promise(resolve => setTimeout(resolve, 50));

        if (typeof name !== 'string' || name?.length === 0) {
            throw new Error('"name" must be a non-empty string');
        }

        if (Boolean(delta) && typeof delta !== 'number') {
            throw new Error('"delta" must be a number');
        }

        if (Boolean(value) && typeof value !== 'number') {
            throw new Error('"value" must be a number');
        }

        if (!Boolean(delta) && !Boolean(value)) {
            throw new Error('Either "value" or "delta" must be present');
        }

        var isReasonEffective = Boolean(reason);
        if (reason && (typeof reason !== 'string' || reason.length > 500)) {
            isReasonEffective = false;
            
            console.warn('"reason" must be a <500 characters string');
        }

        var isURIEffective = Boolean(uri);
        if (uri && (typeof uri !== 'string' || uri.length > 500)) {
            isURIEffective = false;

            console.warn('"uri" must be a <500 characters string');
        }

        try {
            const response = await fetch(`http://localhost:3000/api/update-metric`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._apiKey}`
                },
                body: JSON.stringify({ 
                    name, 
                    delta, 
                    value,
                    sessionUUID: this.sessionUUID, 
                    reason: isReasonEffective ? reason : undefined, 
                    uri: isURIEffective ? uri : undefined 
                })
            });
    
            this._lastPulse = Date.now();
    
            if (!response.ok) {
                if (response.status === 404 && response.statusText === 'METRIC_NOT_FOUND') {
                throw new Error("Failed to update metric. Metric wasn't found.");
            }

                throw new Error('Failed to update metric');
            }
        } catch (error) {
            console.warn(error);
        }
    } 

    async identifyUser(identifier) {
        if(this.userUUID === null) console.warn("Unable to identify user. Waiting for initialization.");
        while(this.userUUID === null) await new Promise(resolve => setTimeout(resolve, 50));

        if (typeof identifier !== 'string' || identifier?.length === 0) {
            throw new Error('"identifier" must be a non-empty string');
        }

        if (identifier.length > 500) {
            throw new Error('"identifier" must be less than 500 characters');
        }

        try {
            const response = await fetch(`http://localhost:3000/api/identify-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._apiKey}`
                },
                body: JSON.stringify({ userUUID: this.userUUID, identifier })
            });

            this._lastPulse = Date.now();

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Failed to identify user. No corresponding sub_user found.');
                }

                throw new Error('Failed to identify user');
            }
        } catch (error) {
            console.warn(error);
        }
    }
}

export default new Heylock();

// TODO: Add server support