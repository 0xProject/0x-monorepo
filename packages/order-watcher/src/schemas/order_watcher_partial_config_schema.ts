export const orderWatcherPartialConfigSchema = {
    id: '/OrderWatcherPartialConfigSchema',
    properties: {
        stateLayer: { $ref: '/BlockParam' },
        orderExpirationCheckingIntervalMs: { type: 'number' },
        eventPollingIntervalMs: { type: 'number' },
        expirationMarginMs: { type: 'number' },
        cleanupJobIntervalMs: { type: 'number' },
        isVerbose: { type: 'boolean' },
    },
    type: 'object',
    required: [],
};
