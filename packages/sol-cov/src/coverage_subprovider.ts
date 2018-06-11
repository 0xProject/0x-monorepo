import * as _ from 'lodash';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { CoverageManager } from './coverage_manager';
import { TraceCollectionSubprovider } from './trace_collection_subprovider';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It's used to compute your code coverage while running solidity tests.
 */
export class CoverageSubprovider extends TraceCollectionSubprovider {
    private _coverageManager: CoverageManager;
    /**
     * Instantiates a CoverageSubprovider instance
     * @param artifactAdapter Adapter for used artifacts format (0x, truffle, giveth, etc.)
     * @param defaultFromAddress default from address to use when sending transactions
     * @param isVerbose If true, we will log any unknown transactions. Otherwise we will ignore them
     */
    constructor(artifactAdapter: AbstractArtifactAdapter, defaultFromAddress: string, isVerbose: boolean = true) {
        const traceCollectionSubproviderConfig = {
            shouldCollectTransactionTraces: true,
            shouldCollectGasEstimateTraces: true,
            shouldCollectCallTraces: true,
        };
        super(defaultFromAddress, traceCollectionSubproviderConfig);
        this._coverageManager = new CoverageManager(artifactAdapter, isVerbose);
    }
    /**
     * Write the test coverage results to a file in Istanbul format.
     */
    public async writeCoverageAsync(): Promise<void> {
        const traceInfos = this.getCollectedTraceInfos();
        _.forEach(traceInfos, traceInfo => this._coverageManager.appendTraceInfo(traceInfo));
        await this._coverageManager.writeCoverageAsync();
    }
}
