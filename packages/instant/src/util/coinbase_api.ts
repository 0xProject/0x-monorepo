import { BigNumber } from '@0xproject/utils';

const baseEndpoint = 'https://api.coinbase.com/v2';
export const coinbaseApi = {
    getEthUsdPrice: async (): Promise<BigNumber> => {
        const res = await fetch(`${baseEndpoint}/prices/ETH-USD/buy`);
        const resJson = await res.json();
        return new BigNumber(resJson.data.amount);
    },
};
