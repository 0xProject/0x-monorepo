import { ECSignature } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Blockchain } from 'ts/blockchain';
import { GenerateOrderForm as GenerateOrderFormComponent } from 'ts/components/generate_order/generate_order_form';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { BlockchainErrs, HashData, SideToAssetToken, TokenByAddress } from 'ts/types';

interface GenerateOrderFormProps {
    blockchain: Blockchain;
    hashData: HashData;
    dispatcher: Dispatcher;
}

interface ConnectedState {
    blockchainErr: BlockchainErrs;
    blockchainIsLoaded: boolean;
    orderExpiryTimestamp: BigNumber;
    orderECSignature: ECSignature;
    userAddress: string;
    orderTakerAddress: string;
    orderSalt: BigNumber;
    networkId: number;
    sideToAssetToken: SideToAssetToken;
    tokenByAddress: TokenByAddress;
    lastForceTokenStateRefetch: number;
}

const mapStateToProps = (state: State, ownProps: GenerateOrderFormProps): ConnectedState => ({
    blockchainErr: state.blockchainErr,
    blockchainIsLoaded: state.blockchainIsLoaded,
    orderExpiryTimestamp: state.orderExpiryTimestamp,
    orderECSignature: state.orderECSignature,
    orderTakerAddress: state.orderTakerAddress,
    orderSalt: state.orderSalt,
    networkId: state.networkId,
    sideToAssetToken: state.sideToAssetToken,
    tokenByAddress: state.tokenByAddress,
    userAddress: state.userAddress,
    lastForceTokenStateRefetch: state.lastForceTokenStateRefetch,
});

export const GenerateOrderForm: React.ComponentClass<GenerateOrderFormProps> = connect(mapStateToProps)(
    GenerateOrderFormComponent,
);
