import * as React from 'react';
import {Blockchain} from 'ts/blockchain';
import {ZeroEx, Order} from '0x.js';
import {FakeTextField} from 'ts/components/ui/fake_text_field';
import ReactTooltip = require('react-tooltip');
import {HashData, Styles} from 'ts/types';
import {constants} from 'ts/utils/constants';

const styles: Styles = {
    textField: {
        overflow: 'hidden',
        paddingTop: 8,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

interface HashInputProps {
    blockchain: Blockchain;
    blockchainIsLoaded: boolean;
    hashData: HashData;
    label: string;
}

interface HashInputState {}

export class HashInput extends React.Component<HashInputProps, HashInputState> {
    public render() {
        const msgHashHex = this.props.blockchainIsLoaded ? this.generateMessageHashHex() : '';
        return (
            <div>
                <FakeTextField label={this.props.label}>
                    <div
                        style={styles.textField}
                        data-tip={true}
                        data-for="hashTooltip"
                    >
                        {msgHashHex}
                    </div>
                </FakeTextField>
                <ReactTooltip id="hashTooltip">{msgHashHex}</ReactTooltip>
            </div>
        );
    }
    private generateMessageHashHex() {
        const exchangeContractAddress = this.props.blockchain.getExchangeContractAddressIfExists();
        const hashData = this.props.hashData;
        const order: Order = {
            exchangeContractAddress,
            expirationUnixTimestampSec: hashData.orderExpiryTimestamp,
            feeRecipient: hashData.feeRecipientAddress,
            maker: hashData.orderMakerAddress,
            makerFee: hashData.makerFee,
            makerTokenAddress: hashData.depositTokenContractAddr,
            makerTokenAmount: hashData.depositAmount,
            salt: hashData.orderSalt,
            taker: hashData.orderTakerAddress,
            takerFee: hashData.takerFee,
            takerTokenAddress: hashData.receiveTokenContractAddr,
            takerTokenAmount: hashData.receiveAmount,
        };
        const orderHash = ZeroEx.getOrderHashHex(order);
        return orderHash;
    }
}
