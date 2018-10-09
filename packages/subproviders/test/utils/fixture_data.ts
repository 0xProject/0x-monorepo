const TEST_RPC_ACCOUNT_0 = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
const TEST_RPC_ACCOUNT_1 = '0x6ecbe1db9ef729cbe972c83fb886247691fb6beb';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const networkId = 42;
export const fixtureData = {
    NULL_ADDRESS,
    TEST_RPC_ACCOUNT_0,
    TEST_RPC_ACCOUNT_0_ACCOUNT_PRIVATE_KEY: 'F2F48EE19680706196E2E339E5DA3491186E0C4C5030670656B0E0164837257D',
    TEST_RPC_ACCOUNT_1,
    TEST_RPC_MNEMONIC: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
    TEST_RPC_MNEMONIC_BASE_DERIVATION_PATH: `44'/60'/0'/0`,
    PERSONAL_MESSAGE_STRING: 'hello world',
    PERSONAL_MESSAGE_SIGNED_RESULT:
        '0x1b0ec5e2908e993d0c8ab6b46da46be2688fdf03c7ea6686075de37392e50a7d7fcc531446699132fbda915bd989882e0064d417018773a315fb8d43ed063c9b00',
    PERSONAL_MESSAGE_ACCOUNT_1_SIGNED_RESULT:
        '0xe7ae0c21d02eb38f2c2a20d9d7876a98cc7ef035b7a4559d49375e2ec735e06f0d0ab0ff92ee56c5ffc28d516e6ed0692d0270feae8796408dbef060c6c7100f01',
    TESTRPC_BASE_DERIVATION_PATH: `m/44'/60'/0'/0`,
    NETWORK_ID: networkId,
    TX_DATA: {
        nonce: '0x00',
        gasPrice: '0x0',
        gas: '0x2710',
        to: NULL_ADDRESS,
        value: '0x00',
        chainId: networkId,
        from: TEST_RPC_ACCOUNT_0,
    },
    // This is the signed result of the above Transaction Data
    TX_DATA_SIGNED_RESULT:
        '0xf85f8080822710940000000000000000000000000000000000000000808078a0712854c73c69445cc1b22a7c3d7312ff9a97fe4ffba35fd636e8236b211b6e7ca0647cee031615e52d916c7c707025bc64ad525d8f1b9876c3435a863b42743178',
    TX_DATA_ACCOUNT_1_SIGNED_RESULT:
        '0xf85f8080822710940000000000000000000000000000000000000000808078a04b02af7ff3f18ce114b601542cc8ebdc50921354f75dd510d31793453a0710e6a0540082a01e475465801b8186a2edc79ec1a2dcf169b9781c25a58a417023c9ca',
    EIP712_TEST_TYPED_DATA: {
        types: {
            EIP712Domain: [
                {
                    name: 'name',
                    type: 'string',
                },
            ],
            Test: [
                {
                    name: 'testAddress',
                    type: 'address',
                },
                {
                    name: 'testNumber',
                    type: 'uint256',
                },
            ],
        },
        domain: {
            name: 'Test',
        },
        message: {
            testAddress: '0x0000000000000000000000000000000000000000',
            testNumber: '12345',
        },
        primaryType: 'Test',
    },
    EIP712_TEST_TYPED_DATA_HASH: '0xb460d69ca60383293877cd765c0f97bd832d66bca720f7e32222ce1118832493',
    EIP712_TEST_TYPED_DATA_SIGNED_RESULT:
        '0x20af5b6bfc3658942198d6eeda159b4ed589f90cee6eac3ba117818ffba5fd7e354a353aad93faabd6eb6c66e17921c92bd1cd09c92a770f554470dc3e254ce701',
};
