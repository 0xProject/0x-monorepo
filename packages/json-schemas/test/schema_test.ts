import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import forEach = require('lodash.foreach');
import 'mocha';

import { schemas, SchemaValidator } from '../src/index';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const CHAIN_ID = 1337;
const {
    numberSchema,
    addressSchema,
    hexSchema,
    orderCancellationRequestsSchema,
    orderFillOrKillRequestsSchema,
    orderFillRequestsSchema,
    orderHashSchema,
    orderSchema,
    signedOrderSchema,
    signedOrdersSchema,
    blockParamSchema,
    blockRangeSchema,
    tokenSchema,
    jsNumber,
    txDataSchema,
    paginatedCollectionSchema,
    relayerApiErrorResponseSchema,
    relayerApiOrderbookResponseSchema,
    relayerApiAssetDataPairsResponseSchema,
    relayerApiOrderConfigPayloadSchema,
    relayerApiOrderConfigResponseSchema,
    relayerApiOrdersChannelSubscribeSchema,
    relayerApiOrdersChannelUpdateSchema,
    relayerApiOrdersResponseSchema,
    relayerApiOrderSchema,
    wholeNumberSchema,
} = schemas;

describe('Schema', () => {
    const validator = new SchemaValidator();
    const validateAgainstSchema = (testCases: any[], schema: any, shouldFail = false) => {
        forEach(testCases, (testCase: any) => {
            const validationResult = validator.validate(testCase, schema);
            const hasErrors = validationResult.errors.length !== 0;
            if (shouldFail) {
                if (!hasErrors) {
                    throw new Error(
                        `Expected testCase: ${JSON.stringify(testCase, null, '\t')} to fail and it didn't.`,
                    );
                }
            } else {
                if (hasErrors) {
                    throw new Error(JSON.stringify(validationResult.errors, null, '\t'));
                }
            }
        });
    };
    const paginatedResponse = {
        total: 100,
        perPage: 10,
        page: 3,
    };
    describe('#numberSchema', () => {
        it('should validate valid numbers', () => {
            const testCases = ['42', '0', '1.3', '0.2', '00.00'];
            validateAgainstSchema(testCases, numberSchema);
        });
        it('should fail for invalid numbers', () => {
            const testCases = ['.3', '1.', 'abacaba', 'и', '1..0'];
            const shouldFail = true;
            validateAgainstSchema(testCases, numberSchema, shouldFail);
        });
    });
    describe('#wholeNumberSchema', () => {
        it('should validate valid numbers', () => {
            const testCases = ['5', '42', '0'];
            validateAgainstSchema(testCases, wholeNumberSchema);
        });
        it('should fail for invalid numbers', () => {
            const testCases = ['1.3', '0.2', '00.00', '.3', '1.', 'abacaba', 'и', '1..0'];
            const shouldFail = true;
            validateAgainstSchema(testCases, wholeNumberSchema, shouldFail);
        });
    });
    describe('#addressSchema', () => {
        it('should validate valid addresses', () => {
            const testCases = ['0x8b0292b11a196601ed2ce54b665cafeca0347d42', NULL_ADDRESS];
            validateAgainstSchema(testCases, addressSchema);
        });
        it('should fail for invalid addresses', () => {
            const testCases = ['0x', '0', '0x00', '0xzzzzzzB11a196601eD2ce54B665CaFEca0347D42'];
            const shouldFail = true;
            validateAgainstSchema(testCases, addressSchema, shouldFail);
        });
    });
    describe('#hexSchema', () => {
        it('should validate valid hex string', () => {
            const testCases = ['0x8b0292b11a196601ed2ce54b665cafeca0347d42', NULL_ADDRESS];
            validateAgainstSchema(testCases, hexSchema);
        });
        it('should fail for invalid hex string', () => {
            const testCases = ['0', '0xzzzzzzB11a196601eD2ce54B665CaFEca0347D42'];
            const shouldFail = true;
            validateAgainstSchema(testCases, hexSchema, shouldFail);
        });
    });
    describe('#orderHashSchema', () => {
        it('should validate valid order hash', () => {
            const testCases = [
                '0x61a3ed31B43c8780e905a260a35faefEc527be7516aa11c0256729b5b351bc33',
                '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            ];
            validateAgainstSchema(testCases, orderHashSchema);
        });
        it('should fail for invalid order hash', () => {
            const testCases = [
                {},
                '0x',
                '0x8b0292B11a196601eD2ce54B665CaFEca0347D42',
                '61a3ed31B43c8780e905a260a35faefEc527be7516aa11c0256729b5b351bc33',
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, orderHashSchema, shouldFail);
        });
    });
    describe('#blockParamSchema', () => {
        it('should validate valid block param', () => {
            const blockNumber = 42;
            const testCases = [blockNumber, 'latest', 'pending', 'earliest'];
            validateAgainstSchema(testCases, blockParamSchema);
        });
        it('should fail for invalid block param', () => {
            const testCases = [{}, '42', 'pemding'];
            const shouldFail = true;
            validateAgainstSchema(testCases, blockParamSchema, shouldFail);
        });
    });
    describe('#blockRangeSchema', () => {
        it('should validate valid subscription opts', () => {
            const testCases = [{ fromBlock: 42, toBlock: 'latest' }, { fromBlock: 42 }, {}];
            validateAgainstSchema(testCases, blockRangeSchema);
        });
        it('should fail for invalid subscription opts', () => {
            const testCases = [{ fromBlock: '42' }];
            const shouldFail = true;
            validateAgainstSchema(testCases, blockRangeSchema, shouldFail);
        });
    });
    describe('#tokenSchema', () => {
        const token = {
            name: 'Zero Ex',
            symbol: 'ZRX',
            decimals: 100500,
            address: '0x8b0292b11a196601ed2ce54b665cafeca0347d42',
            url: 'https://0xproject.com',
        };
        it('should validate valid token', () => {
            const testCases = [token];
            validateAgainstSchema(testCases, tokenSchema);
        });
        it('should fail for invalid token', () => {
            const num = 4;
            const testCases = [
                {
                    ...token,
                    address: null,
                },
                {
                    ...token,
                    decimals: undefined,
                },
                [],
                num,
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, tokenSchema, shouldFail);
        });
    });
    describe('#paginatedCollectionSchema', () => {
        it('should validate valid paginated collections', () => {
            const testCases = [paginatedResponse];
            validateAgainstSchema(testCases, paginatedCollectionSchema);
        });
        it('should fail for invalid paginated collections', () => {
            const paginatedCollectionNoTotal = {
                page: 10,
                perPage: 2,
            };
            const paginatedCollectionNoPerPage = {
                page: 10,
                total: 100,
            };
            const paginatedCollectionNoPage = {
                total: 10,
                perPage: 20,
            };
            const testCases = [{}, paginatedCollectionNoPage, paginatedCollectionNoPerPage, paginatedCollectionNoTotal];
            const shouldFail = true;
            validateAgainstSchema(testCases, paginatedCollectionSchema, shouldFail);
        });
    });
    describe('order including schemas', () => {
        const order = {
            makerAddress: NULL_ADDRESS,
            takerAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            makerFee: '1',
            takerFee: '2',
            makerAssetAmount: '1',
            takerAssetAmount: '2',
            makerAssetData: NULL_ADDRESS,
            takerAssetData: NULL_ADDRESS,
            makerFeeAssetData: NULL_ADDRESS,
            takerFeeAssetData: NULL_ADDRESS,
            salt: '67006738228878699843088602623665307406148487219438534730168799356281242528500',
            feeRecipientAddress: NULL_ADDRESS,
            expirationTimeSeconds: '42',
            domain: {
                verifyingContract: NULL_ADDRESS,
                chainId: CHAIN_ID,
            },
        };
        const relayerApiOrder = {
            order,
            metaData: {
                someMetaData: 5,
            },
        };
        const relayerApiOrdersResponse = {
            ...paginatedResponse,
            records: [relayerApiOrder, relayerApiOrder],
        };
        describe('#orderSchema', () => {
            it('should validate valid order', () => {
                const testCases = [order];
                validateAgainstSchema(testCases, orderSchema);
            });
            it('should fail for invalid order', () => {
                const testCases = [
                    {
                        ...order,
                        salt: undefined,
                    },
                    {
                        ...order,
                        salt: 'salt',
                    },
                    'order',
                ];
                const shouldFail = true;
                validateAgainstSchema(testCases, orderSchema, shouldFail);
            });
        });
        describe('signed order including schemas', () => {
            const signedOrder = {
                ...order,
                signature:
                    '0x031b61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            };
            describe('#signedOrdersSchema', () => {
                it('should validate valid signed orders', () => {
                    const testCases = [[signedOrder], []];
                    validateAgainstSchema(testCases, signedOrdersSchema);
                });
                it('should fail for invalid signed orders', () => {
                    const testCases = [[signedOrder, 1]];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, signedOrdersSchema, shouldFail);
                });
            });
            describe('#signedOrderSchema', () => {
                it('should validate valid signed order', () => {
                    const testCases = [signedOrder];
                    validateAgainstSchema(testCases, signedOrderSchema);
                });
                it('should fail for invalid signed order', () => {
                    const testCases = [
                        {
                            ...signedOrder,
                            signature: undefined,
                        },
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, signedOrderSchema, shouldFail);
                });
            });
            describe('#orderFillOrKillRequestsSchema', () => {
                const orderFillOrKillRequests = [
                    {
                        signedOrder,
                        fillTakerAmount: '5',
                    },
                ];
                it('should validate valid order fill or kill requests', () => {
                    const testCases = [orderFillOrKillRequests];
                    validateAgainstSchema(testCases, orderFillOrKillRequestsSchema);
                });
                it('should fail for invalid order fill or kill requests', () => {
                    const testCases = [
                        [
                            {
                                ...orderFillOrKillRequests[0],
                                fillTakerAmount: undefined,
                            },
                        ],
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, orderFillOrKillRequestsSchema, shouldFail);
                });
            });
            describe('#orderCancellationRequestsSchema', () => {
                const orderCancellationRequests = [
                    {
                        order,
                        takerTokenCancelAmount: '5',
                    },
                ];
                it('should validate valid order cancellation requests', () => {
                    const testCases = [orderCancellationRequests];
                    validateAgainstSchema(testCases, orderCancellationRequestsSchema);
                });
                it('should fail for invalid order cancellation requests', () => {
                    const testCases = [
                        [
                            {
                                ...orderCancellationRequests[0],
                                takerTokenCancelAmount: undefined,
                            },
                        ],
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, orderCancellationRequestsSchema, shouldFail);
                });
            });
            describe('#orderFillRequestsSchema', () => {
                const orderFillRequests = [
                    {
                        signedOrder,
                        takerTokenFillAmount: '5',
                    },
                ];
                it('should validate valid order fill requests', () => {
                    const testCases = [orderFillRequests];
                    validateAgainstSchema(testCases, orderFillRequestsSchema);
                });
                it('should fail for invalid order fill requests', () => {
                    const testCases = [
                        [
                            {
                                ...orderFillRequests[0],
                                takerTokenFillAmount: undefined,
                            },
                        ],
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, orderFillRequestsSchema, shouldFail);
                });
            });
            describe('standard relayer api schemas', () => {
                describe('#relayerApiOrderSchema', () => {
                    it('should validate valid relayer api order', () => {
                        const testCases = [relayerApiOrder];
                        validateAgainstSchema(testCases, relayerApiOrderSchema);
                    });
                    it('should fail for invalid relayer api orders', () => {
                        const testCases = [{}, order, { order }, { order, metaData: 5 }];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiOrderSchema, shouldFail);
                    });
                });
                describe('#relayerApiErrorResponseSchema', () => {
                    it('should validate valid errorResponse', () => {
                        const testCases = [
                            {
                                code: 102,
                                reason: 'Order submission disabled',
                            },
                            {
                                code: 101,
                                reason: 'Validation failed',
                                validationErrors: [
                                    {
                                        field: 'maker',
                                        code: 1002,
                                        reason: 'Invalid address',
                                    },
                                ],
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiErrorResponseSchema);
                    });
                    it('should fail for invalid error responses', () => {
                        const testCases = [
                            {},
                            {
                                code: 102,
                            },
                            {
                                code: '102',
                                reason: 'Order submission disabled',
                            },
                            {
                                reason: 'Order submission disabled',
                            },
                            {
                                code: 101,
                                reason: 'Validation failed',
                                validationErrors: [
                                    {
                                        field: 'maker',
                                        reason: 'Invalid address',
                                    },
                                ],
                            },
                            {
                                code: 101,
                                reason: 'Validation failed',
                                validationErrors: [
                                    {
                                        field: 'maker',
                                        code: '1002',
                                        reason: 'Invalid address',
                                    },
                                ],
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiErrorResponseSchema, shouldFail);
                    });
                });
                describe('#relayerApiOrderConfigPayloadSchema', () => {
                    it('should validate valid fees payloads', () => {
                        const testCases = [
                            {
                                exchangeAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                makerAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                takerAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                makerAssetData: NULL_ADDRESS,
                                takerAssetData: NULL_ADDRESS,
                                makerAssetAmount: '10000000000000000000',
                                takerAssetAmount: '30000000000000000000',
                                expirationTimeSeconds: '42',
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiOrderConfigPayloadSchema);
                    });
                    it('should fail for invalid fees payloads', () => {
                        const checksummedAddress = '0xA2b31daCf30a9C50ca473337c01d8A201ae33e32';
                        const testCases = [
                            {},
                            {
                                makerAssetAmount: '10000000000000000000',
                                takerAssetAmount: '30000000000000000000',
                                makerAssetData: NULL_ADDRESS,
                                takerAssetData: NULL_ADDRESS,
                            },
                            {
                                takerAddress: checksummedAddress,
                                makerAssetAmount: '10000000000000000000',
                                takerAssetAmount: '30000000000000000000',
                            },
                            {
                                makerAssetAmount: 10000000000000000000,
                                takerAssetAmount: 30000000000000000000,
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiOrderConfigPayloadSchema, shouldFail);
                    });
                });
                describe('#relayerApiOrderConfigResponseSchema', () => {
                    it('should validate valid fees responses', () => {
                        const testCases = [
                            {
                                makerFee: '10000000000000000',
                                takerFee: '30000000000000000',
                                feeRecipientAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                senderAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiOrderConfigResponseSchema);
                    });
                    it('should fail for invalid fees responses', () => {
                        const checksummedAddress = '0xA2b31daCf30a9C50ca473337c01d8A201ae33e32';
                        const testCases = [
                            {},
                            {
                                makerFee: 10000000000000000,
                                takerFee: 30000000000000000,
                            },
                            {
                                feeRecipient: checksummedAddress,
                                takerToSpecify: checksummedAddress,
                                makerFee: '10000000000000000',
                                takerFee: '30000000000000000',
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiOrderConfigResponseSchema, shouldFail);
                    });
                });
                describe('#relayerAssetDataPairsResponseSchema', () => {
                    it('should validate valid assetPairs response', () => {
                        const testCases = [
                            {
                                ...paginatedResponse,
                                records: [],
                            },
                            {
                                ...paginatedResponse,
                                records: [
                                    {
                                        assetDataA: {
                                            assetData: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                            minAmount: '0',
                                            maxAmount: '10000000000000000000',
                                            precision: 5,
                                        },
                                        assetDataB: {
                                            assetData: '0xef7fff64389b814a946f3e92105513705ca6b990',
                                            minAmount: '0',
                                            maxAmount: '50000000000000000000',
                                            precision: 5,
                                        },
                                    },
                                ],
                            },
                            {
                                ...paginatedResponse,
                                records: [
                                    {
                                        assetDataA: {
                                            assetData: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                        },
                                        assetDataB: {
                                            assetData: '0xef7fff64389b814a946f3e92105513705ca6b990',
                                        },
                                    },
                                ],
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiAssetDataPairsResponseSchema);
                    });
                    it('should fail for invalid assetPairs responses', () => {
                        const testCases = [
                            {
                                ...paginatedResponse,
                                records: [
                                    {
                                        assetDataA: {
                                            assetData: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                            minAmount: '0',
                                            maxAmount: '10000000000000000000',
                                            precision: 5,
                                        },
                                        assetDataC: {
                                            assetData: '0xef7fff64389b814a946f3e92105513705ca6b990',
                                            minAmount: '0',
                                            maxAmount: '50000000000000000000',
                                            precision: 5,
                                        },
                                    },
                                ],
                            },
                            {
                                records: [
                                    {
                                        assetDataA: {
                                            assetData: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                            minAmount: '0',
                                            maxAmount: '10000000000000000000',
                                            precision: 5,
                                        },
                                        assetDataB: {
                                            assetData: '0xef7fff64389b814a946f3e92105513705ca6b990',
                                            minAmount: '0',
                                            maxAmount: '50000000000000000000',
                                            precision: 5,
                                        },
                                    },
                                ],
                            },
                            {
                                ...paginatedResponse,
                                records: [
                                    {
                                        assetDataA: {
                                            minAmount: '0',
                                            maxAmount: '10000000000000000000',
                                            precision: 5,
                                        },
                                        assetDataB: {
                                            minAmount: '0',
                                            maxAmount: '50000000000000000000',
                                            precision: 5,
                                        },
                                    },
                                ],
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiAssetDataPairsResponseSchema, shouldFail);
                    });
                });
                describe('#relayerApiOrdersResponseSchema', () => {
                    it('should validate valid orders responses', () => {
                        const testCases = [
                            relayerApiOrdersResponse,
                            {
                                ...paginatedResponse,
                                records: [],
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiOrdersResponseSchema);
                    });
                    it('should fail for invalid orders responses', () => {
                        const testCases = [
                            {
                                records: [relayerApiOrder, relayerApiOrder],
                            },
                            {
                                ...paginatedResponse,
                            },
                            {
                                ...paginatedResponse,
                                records: [{}, relayerApiOrder],
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiOrdersResponseSchema, shouldFail);
                    });
                });
                describe('#relayerApiOrderbookResponseSchema', () => {
                    it('should validate valid order book responses', () => {
                        const testCases = [
                            {
                                bids: {
                                    ...paginatedResponse,
                                    records: [relayerApiOrder],
                                },
                                asks: {
                                    ...paginatedResponse,
                                    records: [],
                                },
                            },
                            {
                                bids: {
                                    ...paginatedResponse,
                                    records: [relayerApiOrder, relayerApiOrder],
                                },
                                asks: {
                                    ...paginatedResponse,
                                    records: [relayerApiOrder, relayerApiOrder],
                                },
                            },
                            {
                                bids: {
                                    ...paginatedResponse,
                                    records: [],
                                },
                                asks: {
                                    ...paginatedResponse,
                                    records: [relayerApiOrder, relayerApiOrder],
                                },
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiOrderbookResponseSchema);
                    });
                    it('should fail for invalid order fill requests', () => {
                        const testCases = [
                            {},
                            {
                                bids: {
                                    records: [relayerApiOrder],
                                },
                                asks: {
                                    ...paginatedResponse,
                                    records: [],
                                },
                            },
                            {
                                bids: {
                                    ...paginatedResponse,
                                    records: [relayerApiOrder, relayerApiOrder],
                                },
                                asks: {},
                            },
                            {
                                bids: {
                                    ...paginatedResponse,
                                },
                                asks: {
                                    ...paginatedResponse,
                                    records: [relayerApiOrder, relayerApiOrder],
                                },
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiOrdersResponseSchema, shouldFail);
                    });
                });
                describe('#relayerApiOrdersChannelSubscribeSchema', () => {
                    it('should validate valid orders channel websocket subscribe message', () => {
                        const testCases = [
                            {
                                type: 'subscribe',
                                channel: 'orders',
                                requestId: 'randomId',
                            },
                            {
                                type: 'subscribe',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: {
                                    makerAssetProxyId: '0x02571792',
                                    takerAssetProxyId: '0xf47261b0',
                                },
                            },
                            {
                                type: 'subscribe',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: {},
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiOrdersChannelSubscribeSchema);
                    });
                    it('should fail for invalid orders channel websocket subscribe message', () => {
                        const bogusAddress = '0xz2b31daCf30a9C50ca473337c01d8A201ae33e32';
                        const testCases = [
                            {
                                type: 'subscribe',
                                channel: 'orders',
                            },
                            {
                                type: 'subscribe',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: {
                                    makerAssetProxyId: '0x02571792',
                                    takerAssetProxyId: '0xf47261b0',
                                    makerAssetAddress: bogusAddress,
                                },
                            },
                            {
                                type: 'subscribe',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: {
                                    makerAssetProxyId: 'invalidId',
                                },
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiOrdersChannelSubscribeSchema, shouldFail);
                    });
                });
                describe('#relayerApiOrdersChannelUpdateSchema', () => {
                    it('should validate valid orders channel websocket update message', () => {
                        const testCases = [
                            {
                                type: 'update',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: [relayerApiOrder],
                            },
                            {
                                type: 'update',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: [],
                            },
                        ];
                        validateAgainstSchema(testCases, relayerApiOrdersChannelUpdateSchema);
                    });
                    it('should fail for invalid orders channel websocket update message', () => {
                        const testCases = [
                            {
                                type: 'foo',
                                channel: 'orders',
                                requestId: 'randomId',
                            },
                            {
                                type: 'update',
                                channel: 'bar',
                                requestId: 2,
                                payload: [relayerApiOrder],
                            },
                            {
                                type: 'update',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: {},
                            },
                            {
                                type: 'update',
                                channel: 'orders',
                                requestId: 'randomId',
                                payload: relayerApiErrorResponseSchema,
                            },
                        ];
                        const shouldFail = true;
                        validateAgainstSchema(testCases, relayerApiOrdersChannelUpdateSchema, shouldFail);
                    });
                });
            });
        });
    });
    describe('BigNumber serialization', () => {
        it('should correctly serialize BigNumbers', () => {
            const testCases = {
                '42': '42',
                '0': '0',
                '1.3': '1.3',
                '0.2': '0.2',
                '00.00': '0',
                '.3': '0.3',
            };
            forEach(testCases, (serialized: string, input: string) => {
                expect(JSON.parse(JSON.stringify(new BigNumber(input)))).to.be.equal(serialized);
            });
        });
    });
    describe('#jsNumberSchema', () => {
        it('should validate valid js number', () => {
            // tslint:disable-next-line:custom-no-magic-numbers
            const testCases = [1, 42];
            validateAgainstSchema(testCases, jsNumber);
        });
        it('should fail for invalid js number', () => {
            // tslint:disable-next-line:custom-no-magic-numbers
            const testCases = [NaN, -1, new BigNumber(1)];
            const shouldFail = true;
            validateAgainstSchema(testCases, jsNumber, shouldFail);
        });
    });
    describe('#txDataSchema', () => {
        it('should validate valid txData', () => {
            const bigNumGasAmount = new BigNumber(42);
            const testCases = [
                {
                    from: NULL_ADDRESS,
                },
                {
                    from: NULL_ADDRESS,
                    gas: bigNumGasAmount,
                },
                {
                    from: NULL_ADDRESS,
                    gas: 42,
                },
            ];
            validateAgainstSchema(testCases, txDataSchema);
        });
        it('should fail for invalid txData', () => {
            const testCases = [
                {
                    gas: new BigNumber(42),
                },
                {},
                [],
                new BigNumber(1),
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, txDataSchema, shouldFail);
        });
    });
}); // tslint:disable:max-file-line-count
