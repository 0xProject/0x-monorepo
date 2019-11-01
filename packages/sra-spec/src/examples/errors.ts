export const validationError = {
    code: 100,
    reason: 'Validation failed',
    validationErrors: [
        {
            field: 'chainId',
            code: 1006,
            reason: 'Chain id 42 is not supported',
        },
    ],
};
