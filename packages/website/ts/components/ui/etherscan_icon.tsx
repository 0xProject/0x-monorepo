import { colors, EtherscanLinkSuffixes, utils as sharedUtils } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');

interface EtherScanIconProps {
    addressOrTxHash: string;
    etherscanLinkSuffixes: EtherscanLinkSuffixes;
    networkId: number;
}

export const EtherScanIcon = (props: EtherScanIconProps) => {
    const etherscanLinkIfExists = sharedUtils.getEtherScanLinkIfExists(
        props.addressOrTxHash,
        props.networkId,
        props.etherscanLinkSuffixes,
    );
    const transactionTooltipId = `${props.addressOrTxHash}-etherscan-icon-tooltip`;
    return (
        <div className="inline">
            {!_.isUndefined(etherscanLinkIfExists) ? (
                <a href={etherscanLinkIfExists} target="_blank">
                    {renderIcon()}
                </a>
            ) : (
                <div className="inline" data-tip={true} data-for={transactionTooltipId}>
                    {renderIcon()}
                    <ReactTooltip id={transactionTooltipId}>
                        Your network (id: {props.networkId}) is not supported by Etherscan
                    </ReactTooltip>
                </div>
            )}
        </div>
    );
};

function renderIcon(): React.ReactNode {
    return <i style={{ color: colors.amber600 }} className="zmdi zmdi-open-in-new" />;
}
