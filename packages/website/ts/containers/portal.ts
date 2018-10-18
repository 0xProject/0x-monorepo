import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Portal as PortalComponent, PortalProps as PortalComponentProps } from 'ts/components/portal/portal';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { BlockchainErrs, HashData, PortalOrder, ProviderType, ScreenWidths, Side, TokenByAddress } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    blockchainErr: BlockchainErrs;
    blockchainIsLoaded: boolean;
    hashData: HashData;
    injectedProviderName: string;
    networkId: number;
    nodeVersion: string;
    orderFillAmount: BigNumber;
    providerType: ProviderType;
    tokenByAddress: TokenByAddress;
    lastForceTokenStateRefetch: number;
    userEtherBalanceInWei?: BigNumber;
    screenWidth: ScreenWidths;
    shouldBlockchainErrDialogBeOpen: boolean;
    userAddress: string;
    userSuppliedOrderCache: PortalOrder;
    flashMessage?: string | React.ReactNode;
    translate: Translate;
    isPortalOnboardingShowing: boolean;
    portalOnboardingStep: number;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: PortalComponentProps): ConnectedState => {
    const receiveAssetToken = state.sideToAssetToken[Side.Receive];
    const depositAssetToken = state.sideToAssetToken[Side.Deposit];
    const receiveAddress = !_.isUndefined(receiveAssetToken.address)
        ? receiveAssetToken.address
        : constants.NULL_ADDRESS;
    const depositAddress = !_.isUndefined(depositAssetToken.address)
        ? depositAssetToken.address
        : constants.NULL_ADDRESS;
    const receiveAmount = !_.isUndefined(receiveAssetToken.amount) ? receiveAssetToken.amount : new BigNumber(0);
    const depositAmount = !_.isUndefined(depositAssetToken.amount) ? depositAssetToken.amount : new BigNumber(0);
    const hashData = {
        depositAmount,
        depositTokenContractAddr: depositAddress,
        feeRecipientAddress: constants.NULL_ADDRESS,
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
        hashData,
        injectedProviderName: state.injectedProviderName,
        networkId: state.networkId,
        nodeVersion: state.nodeVersion,
        orderFillAmount: state.orderFillAmount,
        providerType: state.providerType,
        screenWidth: state.screenWidth,
        shouldBlockchainErrDialogBeOpen: state.shouldBlockchainErrDialogBeOpen,
        tokenByAddress: state.tokenByAddress,
        lastForceTokenStateRefetch: state.lastForceTokenStateRefetch,
        userAddress: state.userAddress,
        userEtherBalanceInWei: state.userEtherBalanceInWei,
        userSuppliedOrderCache: state.userSuppliedOrderCache,
        flashMessage: state.flashMessage,
        translate: state.translate,
        isPortalOnboardingShowing: state.isPortalOnboardingShowing,
        portalOnboardingStep: state.portalOnboardingStep,
    };
};

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Portal: React.ComponentClass<PortalComponentProps> = connect(mapStateToProps, mapDispatchToProps)(
    PortalComponent,
);
