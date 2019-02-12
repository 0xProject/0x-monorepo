export const compilerOptionsSchema = {
    id: '/CompilerOptions',
    properties: {
        contractsDir: { type: 'string' },
        artifactsDir: { type: 'string' },
        solcVersion: { type: 'string', pattern: '^\\d+.\\d+.\\d+$' },
        compilerSettings: { type: 'object' },
        contracts: {
            oneOf: [
                {
                    type: 'string',
                    pattern: '^\\*$',
                },
                {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
            ],
        },
        useDockerisedSolc: { type: 'boolean' },
    },
    type: 'object',
    required: [],
    additionalProperties: false,
};
