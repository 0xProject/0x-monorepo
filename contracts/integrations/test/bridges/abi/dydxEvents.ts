// tslint:disable max-file-line-count
export const dydxEvents = {
    contractName: 'Events',
    abi: [
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'market',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            name: 'borrow',
                            type: 'uint96',
                        },
                        {
                            name: 'supply',
                            type: 'uint96',
                        },
                        {
                            name: 'lastUpdate',
                            type: 'uint32',
                        },
                    ],
                    indexed: false,
                    name: 'index',
                    type: 'tuple',
                },
            ],
            name: 'LogIndexUpdate',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: false,
                    name: 'sender',
                    type: 'address',
                },
            ],
            name: 'LogOperation',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'accountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'accountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'market',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'update',
                    type: 'tuple',
                },
                {
                    indexed: false,
                    name: 'from',
                    type: 'address',
                },
            ],
            name: 'LogDeposit',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'accountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'accountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'market',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'update',
                    type: 'tuple',
                },
                {
                    indexed: false,
                    name: 'to',
                    type: 'address',
                },
            ],
            name: 'LogWithdraw',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'accountOneOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'accountOneNumber',
                    type: 'uint256',
                },
                {
                    indexed: true,
                    name: 'accountTwoOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'accountTwoNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'market',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'updateOne',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'updateTwo',
                    type: 'tuple',
                },
            ],
            name: 'LogTransfer',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'accountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'accountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'takerMarket',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'makerMarket',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'takerUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'makerUpdate',
                    type: 'tuple',
                },
                {
                    indexed: false,
                    name: 'exchangeWrapper',
                    type: 'address',
                },
            ],
            name: 'LogBuy',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'accountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'accountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'takerMarket',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'makerMarket',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'takerUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'makerUpdate',
                    type: 'tuple',
                },
                {
                    indexed: false,
                    name: 'exchangeWrapper',
                    type: 'address',
                },
            ],
            name: 'LogSell',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'takerAccountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'takerAccountNumber',
                    type: 'uint256',
                },
                {
                    indexed: true,
                    name: 'makerAccountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'makerAccountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'inputMarket',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'outputMarket',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'takerInputUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'takerOutputUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'makerInputUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'makerOutputUpdate',
                    type: 'tuple',
                },
                {
                    indexed: false,
                    name: 'autoTrader',
                    type: 'address',
                },
            ],
            name: 'LogTrade',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'accountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'accountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'callee',
                    type: 'address',
                },
            ],
            name: 'LogCall',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'solidAccountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'solidAccountNumber',
                    type: 'uint256',
                },
                {
                    indexed: true,
                    name: 'liquidAccountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'liquidAccountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'heldMarket',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'owedMarket',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'solidHeldUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'solidOwedUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'liquidHeldUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'liquidOwedUpdate',
                    type: 'tuple',
                },
            ],
            name: 'LogLiquidate',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: 'solidAccountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'solidAccountNumber',
                    type: 'uint256',
                },
                {
                    indexed: true,
                    name: 'vaporAccountOwner',
                    type: 'address',
                },
                {
                    indexed: false,
                    name: 'vaporAccountNumber',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'heldMarket',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    name: 'owedMarket',
                    type: 'uint256',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'solidHeldUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'solidOwedUpdate',
                    type: 'tuple',
                },
                {
                    components: [
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint256',
                                },
                            ],
                            name: 'deltaWei',
                            type: 'tuple',
                        },
                        {
                            components: [
                                {
                                    name: 'sign',
                                    type: 'bool',
                                },
                                {
                                    name: 'value',
                                    type: 'uint128',
                                },
                            ],
                            name: 'newPar',
                            type: 'tuple',
                        },
                    ],
                    indexed: false,
                    name: 'vaporOwedUpdate',
                    type: 'tuple',
                },
            ],
            name: 'LogVaporize',
            type: 'event',
        },
    ],
};
