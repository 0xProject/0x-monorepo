import { colors } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

interface TransactionSubmittedProps {
    etherScanLinkIfExists?: string;
}

interface TransactionSubmittedState {}

export class TransactionSubmitted extends React.Component<TransactionSubmittedProps, TransactionSubmittedState> {
    public render(): React.ReactNode {
        if (_.isUndefined(this.props.etherScanLinkIfExists)) {
            return <div>Transaction submitted to the network</div>;
        } else {
            return (
                <div>
                    Transaction submitted to the network:{' '}
                    <a style={{ color: colors.white }} href={`${this.props.etherScanLinkIfExists}`} target="_blank">
                        Verify on Etherscan
                    </a>
                </div>
            );
        }
    }
}
