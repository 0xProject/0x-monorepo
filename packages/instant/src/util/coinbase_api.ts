const baseEndpoint = 'https://api.coinbase.com/v2';
export const coinbaseApi = {
    getEthUsdPrice: async (): Promise<string> => {
        const res = await fetch(`${baseEndpoint}/prices/ETH-USD/buy`);
        const resJson = await res.json();
        return resJson.data.amount;
    },
};
