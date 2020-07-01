import Axios from 'axios';
import { toChecksumAddress } from 'ethereumjs-util';

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer';

export const getBalancerAddressesForPairAsync = async (takerToken: string, makerToken: string): Promise<string[]> => {
    const query = `
      query ($tokens: [Bytes!]) {
          pools (where: {tokensList_contains: $tokens, publicSwap: true}) {
            id
          }
        }
    `;
    const variables = {
        tokens: [takerToken, makerToken].map(toChecksumAddress),
    };
    try {
        const response = await Axios.post(
            SUBGRAPH_URL,
            { query, variables },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
        );
        return response.data.pools.map((pool: { id: string }) => pool.id);
    } catch (err) {
        return [];
    }
};
