export const validationError = {
    code: 100,
    reason: 'Validation failed',
    validationErrors: [
        {
            field: 'networkId',
            code: 1006,
            reason: 'Network id 42 is not supported',
        },
    ],
};
