import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import forEach = require('lodash.foreach');
import 'make-promises-safe';
import 'mocha';

import { schemas, SchemaValidator } from '../src/index';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
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
    relayerApiErrorResponseSchema,
    relayerApiOrderBookResponseSchema,
    relayerApiTokenPairsResponseSchema,
    relayerApiFeesPayloadSchema,
    relayerApiFeesResponseSchema,
    relayerApiOrderbookChannelSubscribeSchema,
    relayerApiOrderbookChannelUpdateSchema,
    relayerApiOrderbookChannelSnapshotSchema,
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
    describe('#addressSchema', () => {
        it('should validate valid addresses', () => {
            const testCases = ['0x8b0292b11a196601ed2ce54b665cafeca0347d42', NULL_ADDRESS];
            validateAgainstSchema(testCases, addressSchema);
        });
        it('should fail for invalid addresses', () => {
            const testCases = [
                '0x',
                '0',
                '0x00',
                '0xzzzzzzB11a196601eD2ce54B665CaFEca0347D42',
                '0x8b0292B11a196601eD2ce54B665CaFEca0347D42',
            ];
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
            const testCases = ['0x', '0', '0xzzzzzzB11a196601eD2ce54B665CaFEca0347D42'];
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
            salt: '67006738228878699843088602623665307406148487219438534730168799356281242528500',
            feeRecipientAddress: NULL_ADDRESS,
            expirationTimeSeconds: '42',
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
            describe('#relayerApiOrderBookResponseSchema', () => {
                it('should validate valid order book responses', () => {
                    const testCases = [
                        {
                            bids: [],
                            asks: [],
                        },
                        {
                            bids: [signedOrder, signedOrder],
                            asks: [],
                        },
                        {
                            bids: [],
                            asks: [signedOrder, signedOrder],
                        },
                        {
                            bids: [signedOrder],
                            asks: [signedOrder, signedOrder],
                        },
                    ];
                    validateAgainstSchema(testCases, relayerApiOrderBookResponseSchema);
                });
                it('should fail for invalid order fill requests', () => {
                    const testCases = [
                        {},
                        {
                            bids: [signedOrder, signedOrder],
                        },
                        {
                            asks: [signedOrder, signedOrder],
                        },
                        {
                            bids: signedOrder,
                            asks: [signedOrder, signedOrder],
                        },
                        {
                            bids: [signedOrder],
                            asks: signedOrder,
                        },
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, relayerApiOrderBookResponseSchema, shouldFail);
                });
            });
            describe('#relayerApiOrderbookChannelSubscribeSchema', () => {
                it('should validate valid orderbook channel websocket subscribe message', () => {
                    const testCases = [
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                snapshot: true,
                                limit: 100,
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            },
                        },
                    ];
                    validateAgainstSchema(testCases, relayerApiOrderbookChannelSubscribeSchema);
                });
                it('should fail for invalid orderbook channel websocket subscribe message', () => {
                    const checksummedAddress = '0xA2b31daCf30a9C50ca473337c01d8A201ae33e32';
                    const testCases = [
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                snapshot: true,
                                limit: 100,
                            },
                        },
                        {
                            type: 'foo',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'bar',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: checksummedAddress,
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: checksummedAddress,
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                snapshot: 'true',
                                limit: 100,
                            },
                        },
                        {
                            type: 'subscribe',
                            channel: 'orderbook',
                            requestId: 1,
                            payload: {
                                baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                quoteTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                                snapshot: true,
                                limit: '100',
                            },
                        },
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, relayerApiOrderbookChannelSubscribeSchema, shouldFail);
                });
            });
            describe('#relayerApiOrderbookChannelSnapshotSchema', () => {
                it('should validate valid orderbook channel websocket snapshot message', () => {
                    const testCases = [
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {
                                bids: [],
                                asks: [],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {
                                bids: [signedOrder],
                                asks: [signedOrder],
                            },
                        },
                    ];
                    validateAgainstSchema(testCases, relayerApiOrderbookChannelSnapshotSchema);
                });
                it('should fail for invalid orderbook channel websocket snapshot message', () => {
                    const testCases = [
                        {
                            type: 'foo',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {
                                bids: [signedOrder],
                                asks: [signedOrder],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'bar',
                            requestId: 2,
                            payload: {
                                bids: [signedOrder],
                                asks: [signedOrder],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            payload: {
                                bids: [signedOrder],
                                asks: [signedOrder],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            requestId: '2',
                            payload: {
                                bids: [signedOrder],
                                asks: [signedOrder],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {
                                bids: [signedOrder],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {
                                asks: [signedOrder],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {
                                bids: [signedOrder],
                                asks: [{}],
                            },
                        },
                        {
                            type: 'snapshot',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {
                                bids: [{}],
                                asks: [signedOrder],
                            },
                        },
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, relayerApiOrderbookChannelSnapshotSchema, shouldFail);
                });
            });
            describe('#relayerApiOrderbookChannelUpdateSchema', () => {
                it('should validate valid orderbook channel websocket update message', () => {
                    const testCases = [
                        {
                            type: 'update',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: signedOrder,
                        },
                    ];
                    validateAgainstSchema(testCases, relayerApiOrderbookChannelUpdateSchema);
                });
                it('should fail for invalid orderbook channel websocket update message', () => {
                    const testCases = [
                        {
                            type: 'foo',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: signedOrder,
                        },
                        {
                            type: 'update',
                            channel: 'bar',
                            requestId: 2,
                            payload: signedOrder,
                        },
                        {
                            type: 'update',
                            channel: 'orderbook',
                            requestId: 2,
                            payload: {},
                        },
                    ];
                    const shouldFail = true;
                    validateAgainstSchema(testCases, relayerApiOrderbookChannelUpdateSchema, shouldFail);
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
    describe('#relayerApiFeesPayloadSchema', () => {
        it('should validate valid fees payloads', () => {
            const testCases = [
                {
                    exchangeContractAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                    maker: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                    taker: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                    makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                    takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
                    makerTokenAmount: '10000000000000000000',
                    takerTokenAmount: '30000000000000000000',
                    expirationUnixTimestampSec: '42',
                    salt: '67006738228878699843088602623665307406148487219438534730168799356281242528500',
                },
            ];
            validateAgainstSchema(testCases, relayerApiFeesPayloadSchema);
        });
        it('should fail for invalid fees payloads', () => {
            const checksummedAddress = '0xA2b31daCf30a9C50ca473337c01d8A201ae33e32';
            const testCases = [
                {},
                {
                    takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
                    makerTokenAmount: '10000000000000000000',
                    takerTokenAmount: '30000000000000000000',
                },
                {
                    taker: checksummedAddress,
                    makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                    takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
                    makerTokenAmount: '10000000000000000000',
                    takerTokenAmount: '30000000000000000000',
                },
                {
                    makerTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                    takerTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
                    makerTokenAmount: 10000000000000000000,
                    takerTokenAmount: 30000000000000000000,
                },
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, relayerApiFeesPayloadSchema, shouldFail);
        });
    });
    describe('#relayerApiFeesResponseSchema', () => {
        it('should validate valid fees responses', () => {
            const testCases = [
                {
                    makerFee: '10000000000000000',
                    takerFee: '30000000000000000',
                    feeRecipient: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                },
            ];
            validateAgainstSchema(testCases, relayerApiFeesResponseSchema);
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
            validateAgainstSchema(testCases, relayerApiFeesResponseSchema, shouldFail);
        });
    });
    describe('#relayerApiTokenPairsResponseSchema', () => {
        it('should validate valid tokenPairs response', () => {
            const testCases = [
                [],
                [
                    {
                        tokenA: {
                            address: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            minAmount: '0',
                            maxAmount: '10000000000000000000',
                            precision: 5,
                        },
                        tokenB: {
                            address: '0xef7fff64389b814a946f3e92105513705ca6b990',
                            minAmount: '0',
                            maxAmount: '50000000000000000000',
                            precision: 5,
                        },
                    },
                ],
                [
                    {
                        tokenA: {
                            address: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                        },
                        tokenB: {
                            address: '0xef7fff64389b814a946f3e92105513705ca6b990',
                        },
                    },
                ],
            ];
            validateAgainstSchema(testCases, relayerApiTokenPairsResponseSchema);
        });
        it('should fail for invalid tokenPairs responses', () => {
            const checksummedAddress = '0xA2b31daCf30a9C50ca473337c01d8A201ae33e32';
            const testCases = [
                [
                    {
                        tokenA: {
                            address: checksummedAddress,
                        },
                        tokenB: {
                            address: checksummedAddress,
                        },
                    },
                ],
                [
                    {
                        tokenA: {
                            address: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            minAmount: 0,
                            maxAmount: 10000000000000000000,
                        },
                        tokenB: {
                            address: '0xef7fff64389b814a946f3e92105513705ca6b990',
                            minAmount: 0,
                            maxAmount: 50000000000000000000,
                        },
                    },
                ],
                [
                    {
                        tokenA: {
                            address: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
                            precision: '5',
                        },
                        tokenB: {
                            address: '0xef7fff64389b814a946f3e92105513705ca6b990',
                            precision: '5',
                        },
                    },
                ],
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, relayerApiTokenPairsResponseSchema, shouldFail);
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
                {
                    from: NULL_ADDRESS,
                    unknownProp: 'here',
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
