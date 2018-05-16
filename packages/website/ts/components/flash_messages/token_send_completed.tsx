import { ZeroEx } from '0x.js';
import { colors } from '@0xproject/react-shared';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { Token } from 'ts/types';
import { utils } from 'ts/utils/utils';

interface TokenSendCompletedProps {
    etherScanLinkIfExists?: string;
    token: Token;
    toAddress: string;
    amountInBaseUnits: BigNumber;
}

interface TokenSendCompletedState {}

export class TokenSendCompleted extends React.Component<TokenSendCompletedProps, TokenSendCompletedState> {
    public render(): React.ReactNode {
        const etherScanLink = !_.isUndefined(this.props.etherScanLinkIfExists) && (
            <a style={{ color: colors.white }} href={`${this.props.etherScanLinkIfExists}`} target="_blank">
                Verify on Etherscan
            </a>
        );
        const amountInUnits = ZeroEx.toUnitAmount(this.props.amountInBaseUnits, this.props.token.decimals);
        const truncatedAddress = utils.getAddressBeginAndEnd(this.props.toAddress);
        return (
            <div>
                {`Sent ${amountInUnits} ${this.props.token.symbol} to ${truncatedAddress}: `}
                {etherScanLink}
            </div>
        );
    }
}
