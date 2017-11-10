import * as _ from 'lodash';
import * as Web3 from 'web3';
import {BigNumber} from 'bignumber.js';
import {BlockParamLiteral, InternalZeroExError, ZeroExError} from '../types';
import {Web3Wrapper} from '../web3_wrapper';
import {intervalUtils} from '../utils/interval_utils';

const POLLING_INTERVAL_MS = 500;

/**
 * Store for a current latest block number
 */
export class BlockStore {
    private web3Wrapper?: Web3Wrapper;
    private latestBlockNumber?: number;
    private intervalId?: NodeJS.Timer;
    constructor(web3Wrapper?: Web3Wrapper) {
        this.web3Wrapper = web3Wrapper;
    }
    public getBlockNumberWithNConfirmations(numConfirmations: number): Web3.BlockParam {
        let blockNumber;
        if (numConfirmations === 0) {
            blockNumber = BlockParamLiteral.Pending;
        } else if (numConfirmations === 1) {
            // HACK: We special-case `numConfirmations === 1` so that we can use this block store without actually
            // setting `latestBlockNumber` when block number is latest (in order validation) whhich allows us to omit
            // an async call in a constructor of `ExchangeTransferSimulator`
            blockNumber = BlockParamLiteral.Latest;
        } else {
            if (_.isUndefined(this.latestBlockNumber)) {
                throw new Error(InternalZeroExError.LatestBlockNumberNotSet);
            }
            // Latest block already has 1 confirmation
            blockNumber = this.latestBlockNumber - numConfirmations + 1;
        }
        return blockNumber;
    }
    public async startAsync(): Promise<void> {
        await this.updateLatestBlockAsync();
        this.intervalId = intervalUtils.setAsyncExcludingInterval(
            this.updateLatestBlockAsync.bind(this), POLLING_INTERVAL_MS,
        );
    }
    public stop(): void {
        if (!_.isUndefined(this.intervalId)) {
            intervalUtils.clearAsyncExcludingInterval(this.intervalId);
        }
    }
    private async updateLatestBlockAsync(): Promise<void> {
        if (_.isUndefined(this.web3Wrapper)) {
            throw new Error(InternalZeroExError.Web3WrapperRequiredToStartBlockStore);
        }
        const block = await this.web3Wrapper.getBlockAsync(BlockParamLiteral.Latest);
        if (_.isNull(block.number)) {
            throw new Error(ZeroExError.FailedToFetchLatestBlock);
        }
        this.latestBlockNumber = block.number;
    }
}
