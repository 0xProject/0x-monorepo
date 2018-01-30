export const configs = {
    DISPENSER_ADDRESS: (process.env.DISPENSER_ADDRESS as string).toLowerCase(),
    DISPENSER_PRIVATE_KEY: process.env.DISPENSER_PRIVATE_KEY,
    ENVIRONMENT: process.env.FAUCET_ENVIRONMENT,
    INFURA_API_KEY: process.env.INFURA_API_KEY,
    ROLLBAR_ACCESS_KEY: process.env.FAUCET_ROLLBAR_ACCESS_KEY,
};
