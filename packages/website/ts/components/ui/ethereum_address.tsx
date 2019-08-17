import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import { EtherScanIcon } from 'ts/components/ui/etherscan_icon';
import { EtherscanLinkSuffixes } from 'ts/types';
import { utils } from 'ts/utils/utils';

interface EthereumAddressProps {
    address: string;
    networkId: number;
}

export const EthereumAddress = (props: EthereumAddressProps) => {
    const tooltipId = `${props.address}-ethereum-address`;
    const truncatedAddress = utils.getAddressBeginAndEnd(props.address);
    return (
        <div>
            <div className="inline" style={{ fontSize: 13 }} data-tip={true} data-for={tooltipId}>
                {truncatedAddress}
            </div>
            <div className="pl1 inline">
                <EtherScanIcon
                    addressOrTxHash={props.address}
                    networkId={props.networkId}
                    etherscanLinkSuffixes={EtherscanLinkSuffixes.Address}
                />
            </div>
            <ReactTooltip id={tooltipId}>{props.address}</ReactTooltip>
        </div>
    );
};
