import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { ProfilerManager } from './profiler_manager';
import { TraceCollectionSubprovider } from './trace_collection_subprovider';
import { TraceInfo } from './types';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * ProfilerSubprovider is used to profile Solidity code while running tests.
 */
export class ProfilerSubprovider extends TraceCollectionSubprovider {
    private _profilerManager: ProfilerManager;
    /**
     * Instantiates a ProfilerSubprovider instance
     * @param artifactAdapter Adapter for used artifacts format (0x, truffle, giveth, etc.)
     * @param defaultFromAddress default from address to use when sending transactions
     * @param isVerbose If true, we will log any unknown transactions. Otherwise we will ignore them
     */
    constructor(artifactAdapter: AbstractArtifactAdapter, defaultFromAddress: string, isVerbose: boolean = true) {
        const traceCollectionSubproviderConfig = {
            shouldCollectTransactionTraces: true,
            shouldCollectGasEstimateTraces: false,
            shouldCollectCallTraces: false,
        };
        super(defaultFromAddress, traceCollectionSubproviderConfig);
        this._profilerManager = new ProfilerManager(artifactAdapter, isVerbose);
    }
    public async handleTraceInfoAsync(traceInfo: TraceInfo): Promise<void> {
        await this._profilerManager.computeSingleTraceCoverageAsync(traceInfo);
    }
    /**
     * Write the test profiler results to a file in Istanbul format.
     */
    public async writeProfilerOutputAsync(): Promise<void> {
        await this._profilerManager.writeProfilerOutputAsync();
    }
}
