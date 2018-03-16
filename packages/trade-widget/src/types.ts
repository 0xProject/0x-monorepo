import { Order, SignedOrder } from '0x.js';
import * as Web3 from 'web3';

export type ArtifactContractName = 'Forwarder';

export interface Artifact {
    contract_name: ArtifactContractName;
    networks: {
        [networkId: number]: {
            address: string;
            abi: Web3.ContractAbi;
        };
    };
}

export declare type OrderUpdateCallback = (order: SignedOrder) => any;
export interface LiquidityProvider {
    start(): void;
    stop(): void;
}
