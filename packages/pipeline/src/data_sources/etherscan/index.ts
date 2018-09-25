import { default as axios } from 'axios';
import { BlockParam, BlockParamLiteral } from 'ethereum-types';

const ETHERSCAN_URL = 'https://api.etherscan.io/api';

export class Etherscan {
    private readonly _apiKey: string;
    constructor(apiKey: string) {
        this._apiKey = apiKey;
    }

    /**
     * Gets the raw events for a specific contract and block range.
     * @param contractAddress  The address of the contract to get the events for.
     * @param fromBlock The start of the block range to get events for (inclusive).
     * @param toBlock The end of the block range to get events for (inclusive).
     * @returns A list of decoded events.
     */
    public async getContractEventsAsync(
        contractAddress: string,
        fromBlock: BlockParam = BlockParamLiteral.Earliest,
        toBlock: BlockParam = BlockParamLiteral.Latest,
    ): Promise<EventsResponse> {
        const fullURL = `${ETHERSCAN_URL}?module=logs&action=getLogs&address=${contractAddress}&fromBlock=${fromBlock}&toBlock=${toBlock}&apikey=${
            this._apiKey
        }`;
        const resp = await axios.get<EventsResponse>(fullURL);
        // TODO(albrow): Check response code.
        return resp.data;
    }
}

// Raw events response from etherescan.io
export interface EventsResponse {
    status: string;
    message: string;
    result: EventsResponseResult[];
}

// Events as represented in the response from etherscan.io
export interface EventsResponseResult {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    timeStamp: string;
    gasPrice: string;
    gasUsed: string;
    logIndex: string;
    transactionHash: string;
    transactionIndex: string;
}
