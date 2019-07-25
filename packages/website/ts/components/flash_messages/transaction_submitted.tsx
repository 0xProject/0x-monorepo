import * as _ from 'lodash';
import * as React from 'react';
import { colors } from 'ts/utils/colors';

interface TransactionSubmittedProps {
    etherScanLinkIfExists?: string;
}

interface TransactionSubmittedState {}

export class TransactionSubmitted extends React.Component<TransactionSubmittedProps, TransactionSubmittedState> {
    public render(): React.ReactNode {
        if (this.props.etherScanLinkIfExists === undefined) {
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
