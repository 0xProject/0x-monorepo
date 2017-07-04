import 'mocha';
import * as _ from 'lodash';
import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {constants} from './utils/constants';
import {SchemaValidator} from '../src/utils/schema_validator';
import {tokenSchema} from '../src/schemas/token_schema';
import {orderSchema, signedOrderSchema} from '../src/schemas/order_schemas';
import {addressSchema, numberSchema} from '../src/schemas/basic_type_schemas';
import {orderFillOrKillRequestsSchema} from '../src/schemas/order_fill_or_kill_requests_schema';
import {ecSignatureParameterSchema, ecSignatureSchema} from '../src/schemas/ec_signature_schema';
import {orderCancellationRequestsSchema} from '../src/schemas/order_cancel_schema';
import {orderFillRequestsSchema} from '../src/schemas/order_fill_requests_schema';
import {blockParamSchema, subscriptionOptsSchema} from '../src/schemas/subscription_opts_schema';

chai.config.includeStack = true;
const expect = chai.expect;

describe('Schema', () => {
    const validator = new SchemaValidator();
    const validateAgainstSchema = (testCases: any[], schema: any, shouldFail = false) => {
        _.forEach(testCases, (testCase: any) => {
            if (shouldFail) {
                expect(validator.validate(testCase, schema).errors).to.be.lengthOf.at.least(1);
            } else {
                expect(validator.validate(testCase, schema).errors).to.be.lengthOf(0);
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
            const testCases = ['0x8b0292B11a196601eD2ce54B665CaFEca0347D42', constants.NULL_ADDRESS];
            validateAgainstSchema(testCases, addressSchema);
        });
        it('should fail for invalid addresses', () => {
            const testCases = ['0x', '0', '0x00', '0xzzzzzzB11a196601eD2ce54B665CaFEca0347D42'];
            const shouldFail = true;
            validateAgainstSchema(testCases, addressSchema, shouldFail);
        });
    });
    describe('#ecSignatureParameterSchema', () => {
        it('should validate valid parameters', () => {
            const testCases = [
                '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                '0X40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            ];
            validateAgainstSchema(testCases, ecSignatureParameterSchema);
        });
        it('should fail for invalid parameters', () => {
            const testCases = [
                '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3',  // shorter
                '0xzzzz9190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254', // invalid characters
                '40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',   // no 0x
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, ecSignatureParameterSchema, shouldFail);
        });
    });
    describe('#ecSignatureSchema', () => {
        it('should validate valid signature', () => {
            const signature = {
                v: 27,
                r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            };
            const testCases = [
                signature,
                {
                    ...signature,
                    v: 28,
                },
            ];
            validateAgainstSchema(testCases, ecSignatureSchema);
        });
        it('should fail for invalid signature', () => {
            const v = 27;
            const r = '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33';
            const s = '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254';
            const testCases = [
                {},
                {v},
                {r, s, v: 31},
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, ecSignatureSchema, shouldFail);
        });
    });
    describe('#blockParamSchema', () => {
        it('should validate valid block param', () => {
            const testCases = [
                42,
                'latest',
                'pending',
                'earliest',
            ];
            validateAgainstSchema(testCases, blockParamSchema);
        });
        it('should fail for invalid block param', () => {
            const testCases = [
                {},
                '42',
                'pemding',
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, blockParamSchema, shouldFail);
        });
    });
    describe('#subscriptionOptsSchema', () => {
        it('should validate valid subscription opts', () => {
            const testCases = [
                {fromBlock: 42, toBlock: 'latest'},
            ];
            validateAgainstSchema(testCases, subscriptionOptsSchema);
        });
        it('should fail for invalid subscription opts', () => {
            const testCases = [
                {},
                {fromBlock: 42},
                {fromBlock: 42, to: 43},
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, subscriptionOptsSchema, shouldFail);
        });
    });
    describe('#tokenSchema', () => {
        const token = {
            name: 'Zero Ex',
            symbol: 'ZRX',
            decimals: 100500,
            address: '0x8b0292B11a196601eD2ce54B665CaFEca0347D42',
            url: 'https://0xproject.com',
        };
        it('should validate valid token', () => {
            const testCases = [
                token,
            ];
            validateAgainstSchema(testCases, tokenSchema);
        });
        it('should fail for invalid token', () => {
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
                4,
                {
                    ...token,
                    url: 'not an url',
                },
            ];
            const shouldFail = true;
            validateAgainstSchema(testCases, tokenSchema, shouldFail);
        });
    });
    describe('order including schemas', () => {
        const order = {
            maker: constants.NULL_ADDRESS,
            taker: constants.NULL_ADDRESS,
            makerFee: '1',
            takerFee: '2',
            makerTokenAmount: '1',
            takerTokenAmount: '2',
            makerTokenAddress: constants.NULL_ADDRESS,
            takerTokenAddress: constants.NULL_ADDRESS,
            salt: '256',
            feeRecipient: constants.NULL_ADDRESS,
            expirationUnixTimestampSec: '42',
        };
        describe('#orderSchema', () => {
            it('should validate valid order', () => {
                const testCases = [
                    order,
                ];
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
                ecSignature: {
                    v: 27,
                    r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                    s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
                },
            };
            describe('#signedOrderSchema', () => {
                it('should validate valid signed order', () => {
                    const testCases = [
                        signedOrder,
                    ];
                    validateAgainstSchema(testCases, signedOrderSchema);
                });
                it('should fail for invalid signed order', () => {
                    const testCases = [
                        {
                            ...signedOrder,
                            ecSignature: undefined,
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
                    const testCases = [
                        orderFillOrKillRequests,
                    ];
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
                    const testCases = [
                        orderCancellationRequests,
                    ];
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
                    const testCases = [
                        orderFillRequests,
                    ];
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
            _.forEach(testCases, (serialized: string, input: string) => {
                expect(JSON.parse(JSON.stringify(new BigNumber(input)))).to.be.equal(serialized);
            });
        });
    });
});
