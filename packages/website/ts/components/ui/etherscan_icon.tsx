import * as _ from 'lodash';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import {colors} from 'material-ui/styles';
import {EtherscanLinkSuffixes} from 'ts/types';
import {utils} from 'ts/utils/utils';

interface EtherScanIconProps {
    addressOrTxHash: string;
    etherscanLinkSuffixes: EtherscanLinkSuffixes;
    networkId: number;
}

export const EtherScanIcon = (props: EtherScanIconProps) => {
    const etherscanLinkIfExists = utils.getEtherScanLinkIfExists(
        props.addressOrTxHash, props.networkId, EtherscanLinkSuffixes.address,
    );
    const transactionTooltipId = `${props.addressOrTxHash}-etherscan-icon-tooltip`;
    return (
        <div className="inline">
            {!_.isUndefined(etherscanLinkIfExists) ?
                <a
                    href={etherscanLinkIfExists}
                    target="_blank"
                >
                    {renderIcon()}
                </a> :
                <div
                    className="inline"
                    data-tip={true}
                    data-for={transactionTooltipId}
                >
                    {renderIcon()}
                    <ReactTooltip id={transactionTooltipId}>
                        Your network (id: {props.networkId}) is not supported by Etherscan
                    </ReactTooltip>
                </div>
            }
        </div>
    );
};

function renderIcon() {
    return (
        <i
            style={{color: colors.amber600}}
            className="zmdi zmdi-open-in-new"
        />
    );
}
