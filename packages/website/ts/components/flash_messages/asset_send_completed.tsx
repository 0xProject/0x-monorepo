import { colors } from '@0x/react-shared';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import * as React from 'react';
import { utils } from 'ts/utils/utils';

interface AssetSendCompletedProps {
    etherScanLinkIfExists?: string;
    toAddress: string;
    amountInBaseUnits: BigNumber;
    decimals: number;
    symbol: string;
}

interface AssetSendCompletedState {}

export class AssetSendCompleted extends React.Component<AssetSendCompletedProps, AssetSendCompletedState> {
    public render(): React.ReactNode {
        const etherScanLink = !_.isUndefined(this.props.etherScanLinkIfExists) && (
            <a style={{ color: colors.white }} href={`${this.props.etherScanLinkIfExists}`} target="_blank">
                Verify on Etherscan
            </a>
        );
        const amountInUnits = Web3Wrapper.toUnitAmount(this.props.amountInBaseUnits, this.props.decimals);
        const truncatedAddress = utils.getAddressBeginAndEnd(this.props.toAddress);
        return (
            <div>
                {`Sent ${amountInUnits} ${this.props.symbol} to ${truncatedAddress}: `}
                {etherScanLink}
            </div>
        );
    }
}
