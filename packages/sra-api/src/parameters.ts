import { ParameterLocation, ParameterObject } from '@loopback/openapi-v3-types';
export const paginationParameters: ParameterObject[] = [
    {
        name: 'page',
        in: 'query',
        description: 'The number of the page to request in the collection.',
        example: 3,
        schema: {
            type: 'number',
        },
    },
    {
        name: 'per_page',
        in: 'query',
        description: 'The number of records to return per page.',
        example: 10,
        schema: {
            type: 'number',
        },
    },
];

export const networkdIdParameter: ParameterObject = {
    name: 'network_id',
    in: 'query',
    description: 'The id of the Ethereum network',
    example: 42,
    default: 1,
    schema: {
        type: 'number',
    },
};

export const generateParameters = (parameters: ParameterObject[], isPaginated: boolean = false): ParameterObject[] => {
    const optionalParameters = isPaginated ? paginationParameters : [];
    return [networkdIdParameter, ...optionalParameters, ...parameters];
};
