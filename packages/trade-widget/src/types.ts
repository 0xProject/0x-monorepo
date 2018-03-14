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
