import { artifacts as exchangeArtifacts } from '@0x/contracts-exchange';
import { LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TransactionReceiptWithDecodedLogs, ZeroExProvider } from 'ethereum-types';

import { artifacts, CoordinatorRegistryContract } from '../../src';

export class CoordinatorRegistryWrapper {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: ZeroExProvider;
    private readonly _logDecoder: LogDecoder;
    private _coordinatorRegistryContract?: CoordinatorRegistryContract;
    /**
     * Instanitates an CoordinatorRegistryWrapper
     * @param provider Web3 provider to use for all JSON RPC requests
     * Instance of CoordinatorRegistryWrapper
     */
    constructor(provider: ZeroExProvider) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._logDecoder = new LogDecoder(this._web3Wrapper, { ...exchangeArtifacts, ...artifacts });
    }
    public async deployCoordinatorRegistryAsync(): Promise<CoordinatorRegistryContract> {
        this._coordinatorRegistryContract = await CoordinatorRegistryContract.deployFrom0xArtifactAsync(
            artifacts.CoordinatorRegistry,
            this._provider,
            txDefaults,
            artifacts,
        );
        if (this._coordinatorRegistryContract === undefined) {
            throw new Error(`Failed to deploy Coordinator Registry contract.`);
        }
        return this._coordinatorRegistryContract;
    }
    public async setCoordinatorEndpointAsync(
        coordinatorOperator: string,
        coordinatorEndpoint: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        this._assertCoordinatorRegistryDeployed();
        const txReceipt = await this._logDecoder.getTxWithDecodedLogsAsync(
            await (this
                ._coordinatorRegistryContract as CoordinatorRegistryContract).setCoordinatorEndpoint.sendTransactionAsync(
                coordinatorEndpoint,
                {
                    from: coordinatorOperator,
                },
            ),
        );
        return txReceipt;
    }
    public async getCoordinatorEndpointAsync(coordinatorOperator: string): Promise<string> {
        this._assertCoordinatorRegistryDeployed();
        const coordinatorEndpoint = await (this
            ._coordinatorRegistryContract as CoordinatorRegistryContract).getCoordinatorEndpoint.callAsync(
            coordinatorOperator,
        );
        return coordinatorEndpoint;
    }
    private _assertCoordinatorRegistryDeployed(): void {
        if (this._coordinatorRegistryContract === undefined) {
            throw new Error(
                'The Coordinator Registry contract was not deployed through the CoordinatorRegistryWrapper. Call `deployCoordinatorRegistryAsync` to deploy.',
            );
        }
    }
}
