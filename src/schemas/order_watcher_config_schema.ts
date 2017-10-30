export const orderWatcherConfigSchema = {
    id: '/OrderWatcherConfig',
    properties: {
        mempoolPollingIntervalMs: {$ref: '/Number'},
    },
    type: 'object',
};
