import { configs } from './configs';

const productionRpcUrls = {
    '3': `https://ropsten.infura.io/${configs.INFURA_API_KEY}`,
    '42': `https://kovan.infura.io/${configs.INFURA_API_KEY}`,
};

const developmentRpcUrls = {
    '50': 'http://127.0.0.1:8545',
};

export const rpcUrls = configs.ENVIRONMENT === 'development' ? developmentRpcUrls : productionRpcUrls;
