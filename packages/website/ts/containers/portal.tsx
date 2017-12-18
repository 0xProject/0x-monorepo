import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {
    Portal as PortalComponent,
    PortalAllProps as PortalComponentAllProps,
    PortalPassedProps as PortalComponentPassedProps,
} from 'ts/components/portal';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';
import {
    BlockchainErrs,
    HashData,
    Order,
    ScreenWidths,
    Side,
    TokenByAddress,
    TokenStateByAddress,
} from 'ts/types';
import {constants} from 'ts/utils/constants';

interface ConnectedState {
    blockchainErr: BlockchainErrs;
    blockchainIsLoaded: boolean;
    hashData: HashData;
    networkId: number;
    nodeVersion: string;
    orderFillAmount: BigNumber;
    tokenByAddress: TokenByAddress;
    tokenStateByAddress: TokenStateByAddress;
    userEtherBalance: BigNumber;
    screenWidth: ScreenWidths;
    shouldBlockchainErrDialogBeOpen: boolean;
    userAddress: string;
    userSuppliedOrderCache: Order;
    flashMessage?: string|React.ReactNode;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, ownProps: PortalComponentAllProps): ConnectedState => {
    const receiveAssetToken = state.sideToAssetToken[Side.Receive];
    const depositAssetToken = state.sideToAssetToken[Side.Deposit];
    const receiveAddress = !_.isUndefined(receiveAssetToken.address) ?
                          receiveAssetToken.address : constants.NULL_ADDRESS;
    const depositAddress = !_.isUndefined(depositAssetToken.address) ?
                          depositAssetToken.address : constants.NULL_ADDRESS;
    const receiveAmount = !_.isUndefined(receiveAssetToken.amount) ?
                          receiveAssetToken.amount : new BigNumber(0);
    const depositAmount = !_.isUndefined(depositAssetToken.amount) ?
                          depositAssetToken.amount : new BigNumber(0);
    const hashData = {
        depositAmount,
        depositTokenContractAddr: depositAddress,
        feeRecipientAddress: constants.FEE_RECIPIENT_ADDRESS,
        makerFee: constants.MAKER_FEE,
        orderExpiryTimestamp: state.orderExpiryTimestamp,
        orderMakerAddress: state.userAddress,
        orderTakerAddress: state.orderTakerAddress !== '' ? state.orderTakerAddress : constants.NULL_ADDRESS,
        receiveAmount,
        receiveTokenContractAddr: receiveAddress,
        takerFee: constants.TAKER_FEE,
        orderSalt: state.orderSalt,
    };
    return {
        blockchainErr: state.blockchainErr,
        blockchainIsLoaded: state.blockchainIsLoaded,
        networkId: state.networkId,
        nodeVersion: state.nodeVersion,
        orderFillAmount: state.orderFillAmount,
        hashData,
        screenWidth: state.screenWidth,
        shouldBlockchainErrDialogBeOpen: state.shouldBlockchainErrDialogBeOpen,
        tokenByAddress: state.tokenByAddress,
        tokenStateByAddress: state.tokenStateByAddress,
        userAddress: state.userAddress,
        userEtherBalance: state.userEtherBalance,
        userSuppliedOrderCache: state.userSuppliedOrderCache,
        flashMessage: state.flashMessage,
    };
};

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Portal: React.ComponentClass<PortalComponentPassedProps> =
  connect(mapStateToProps, mapDispatchToProps)(PortalComponent);
