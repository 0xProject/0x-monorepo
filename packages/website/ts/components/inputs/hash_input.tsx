import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import ReactTooltip from 'react-tooltip';

import { Blockchain } from 'ts/blockchain';
import { FakeTextField } from 'ts/components/ui/fake_text_field';
import { HashData, Styles } from 'ts/types';
import { constants } from 'ts/utils/constants';

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
    public render(): React.ReactNode {
        const msgHashHex = this.props.blockchainIsLoaded ? this._generateMessageHashHex() : '';
        return (
            <div>
                <FakeTextField label={this.props.label}>
                    <div style={styles.textField} data-tip={true} data-for="hashTooltip">
                        {msgHashHex}
                    </div>
                </FakeTextField>
                <ReactTooltip id="hashTooltip">{msgHashHex}</ReactTooltip>
            </div>
        );
    }
    private _generateMessageHashHex(): string {
        const exchangeAddress = this.props.blockchain.getExchangeContractAddressIfExists();
        const hashData = this.props.hashData;
        const makerAssetData = assetDataUtils.encodeERC20AssetData(hashData.depositTokenContractAddr);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(hashData.receiveTokenContractAddr);
        const order: Order = {
            senderAddress: constants.NULL_ADDRESS,
            exchangeAddress,
            expirationTimeSeconds: hashData.orderExpiryTimestamp,
            feeRecipientAddress: hashData.feeRecipientAddress,
            makerAddress: _.isEmpty(hashData.orderMakerAddress) ? constants.NULL_ADDRESS : hashData.orderMakerAddress,
            makerFee: hashData.makerFee,
            makerAssetData,
            makerAssetAmount: hashData.depositAmount,
            salt: hashData.orderSalt,
            takerAddress: hashData.orderTakerAddress,
            takerFee: hashData.takerFee,
            takerAssetData,
            takerAssetAmount: hashData.receiveAmount,
        };
        const orderHash = orderHashUtils.getOrderHashHex(order);
        return orderHash;
    }
}
