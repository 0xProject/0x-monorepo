export const constants = {
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
    RPC_PORT: process.env.RPC_PORT ? parseInt(process.env.RPC_PORT) : 8545,
    GAS_LIMIT: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 7000000,
    TESTRPC_FIRST_ADDRESS: process.env.TESTRPC_FIRST_ADDRESS || '0x5409ed021d9299bf6814279a6a1411a7e866a631',
};
