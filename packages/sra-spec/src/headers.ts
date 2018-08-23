export const headers = {
    'X-Rate-Limit-Limit': {
        description: `The maximum number of requests you're permitted to make per hour.`,
        schema: {
            type: 'integer',
        },
    },
    'X-Rate-Limit-Remaining': {
        description: 'The number of requests remaining in the current rate limit window.',
        schema: {
            type: 'integer',
        },
    },
    'X-Rate-Limit-Reset': {
        description: 'The time at which the current rate limit window resets in UTC epoch seconds.',
        schema: {
            type: 'integer',
        },
    },
};
