export const orderWatcherPartialConfigSchema = {
    id: '/OrderWatcherPartialConfigSchema',
    properties: {
        stateLayer: { $ref: '/blockParamSchema' },
        orderExpirationCheckingIntervalMs: { type: 'number' },
        eventPollingIntervalMs: { type: 'number' },
        expirationMarginMs: { type: 'number' },
        cleanupJobIntervalMs: { type: 'number' },
        isVerbose: { type: 'boolean' },
    },
    type: 'object',
    required: [],
};
