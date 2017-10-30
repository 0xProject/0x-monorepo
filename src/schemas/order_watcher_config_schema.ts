export const orderWatcherConfigSchema = {
    id: '/OrderWatcherConfig',
    properties: {
        mempoolPollingIntervalMs: {
            type: 'number',
            min: 0,
        },
    },
    type: 'object',
};
