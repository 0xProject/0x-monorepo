import { ECSignature } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import { Dispatch } from 'redux';
import { State } from 'ts/redux/reducer';
import {
    ActionTypes,
    AssetToken,
    BlockchainErrs,
    Language,
    Order,
    ProviderType,
    ScreenWidths,
    Side,
    SideToAssetToken,
    Token,
    TokenByAddress,
} from 'ts/types';

export class Dispatcher {
    private _dispatch: Dispatch<State>;
    constructor(dispatch: Dispatch<State>) {
        this._dispatch = dispatch;
    }
    // Portal
    public resetState() {
        this._dispatch({
            type: ActionTypes.ResetState,
        });
    }
    public updateNodeVersion(nodeVersion: string) {
        this._dispatch({
            data: nodeVersion,
            type: ActionTypes.UpdateNodeVersion,
        });
    }
    public updateScreenWidth(screenWidth: ScreenWidths) {
        this._dispatch({
            data: screenWidth,
            type: ActionTypes.UpdateScreenWidth,
        });
    }
    public swapAssetTokenSymbols() {
        this._dispatch({
            type: ActionTypes.SwapAssetTokens,
        });
    }
    public updateOrderSalt(salt: BigNumber) {
        this._dispatch({
            data: salt,
            type: ActionTypes.UpdateOrderSalt,
        });
    }
    public updateUserSuppliedOrderCache(order: Order) {
        this._dispatch({
            data: order,
            type: ActionTypes.UpdateUserSuppliedOrderCache,
        });
    }
    public updateShouldBlockchainErrDialogBeOpen(shouldBeOpen: boolean) {
        this._dispatch({
            data: shouldBeOpen,
            type: ActionTypes.UpdateShouldBlockchainErrDialogBeOpen,
        });
    }
    public updateChosenAssetToken(side: Side, token: AssetToken) {
        this._dispatch({
            data: {
                side,
                token,
            },
            type: ActionTypes.UpdateChosenAssetToken,
        });
    }
    public updateChosenAssetTokenAddress(side: Side, address: string) {
        this._dispatch({
            data: {
                address,
                side,
            },
            type: ActionTypes.UpdateChosenAssetTokenAddress,
        });
    }
    public updateOrderTakerAddress(address: string) {
        this._dispatch({
            data: address,
            type: ActionTypes.UpdateOrderTakerAddress,
        });
    }
    public updateUserAddress(address?: string) {
        this._dispatch({
            data: address,
            type: ActionTypes.UpdateUserAddress,
        });
    }
    public updateOrderExpiry(unixTimestampSec: BigNumber) {
        this._dispatch({
            data: unixTimestampSec,
            type: ActionTypes.UpdateOrderExpiry,
        });
    }
    public encounteredBlockchainError(err: BlockchainErrs) {
        this._dispatch({
            data: err,
            type: ActionTypes.BlockchainErrEncountered,
        });
    }
    public updateBlockchainIsLoaded(isLoaded: boolean) {
        this._dispatch({
            data: isLoaded,
            type: ActionTypes.UpdateBlockchainIsLoaded,
        });
    }
    public addTokenToTokenByAddress(token: Token) {
        this._dispatch({
            data: token,
            type: ActionTypes.AddTokenToTokenByAddress,
        });
    }
    public removeTokenToTokenByAddress(token: Token) {
        this._dispatch({
            data: token,
            type: ActionTypes.RemoveTokenFromTokenByAddress,
        });
    }
    public batchDispatch(
        tokenByAddress: TokenByAddress,
        networkId: number,
        userAddressIfExists: string | undefined,
        sideToAssetToken: SideToAssetToken,
    ) {
        this._dispatch({
            data: {
                tokenByAddress,
                networkId,
                userAddressIfExists,
                sideToAssetToken,
            },
            type: ActionTypes.BatchDispatch,
        });
    }
    public updateTokenByAddress(tokens: Token[]) {
        this._dispatch({
            data: tokens,
            type: ActionTypes.UpdateTokenByAddress,
        });
    }
    public forceTokenStateRefetch() {
        this._dispatch({
            type: ActionTypes.ForceTokenStateRefetch,
        });
    }
    public updateECSignature(ecSignature: ECSignature) {
        this._dispatch({
            data: ecSignature,
            type: ActionTypes.UpdateOrderECSignature,
        });
    }
    public updateUserWeiBalance(balance: BigNumber) {
        this._dispatch({
            data: balance,
            type: ActionTypes.UpdateUserEtherBalance,
        });
    }
    public updateNetworkId(networkId: number) {
        this._dispatch({
            data: networkId,
            type: ActionTypes.UpdateNetworkId,
        });
    }
    public updateOrderFillAmount(amount: BigNumber) {
        this._dispatch({
            data: amount,
            type: ActionTypes.UpdateOrderFillAmount,
        });
    }

    // Docs
    public updateCurrentDocsVersion(version: string) {
        this._dispatch({
            data: version,
            type: ActionTypes.UpdateLibraryVersion,
        });
    }
    public updateAvailableDocVersions(versions: string[]) {
        this._dispatch({
            data: versions,
            type: ActionTypes.UpdateAvailableLibraryVersions,
        });
    }

    // Shared
    public showFlashMessage(msg: string | React.ReactNode) {
        this._dispatch({
            data: msg,
            type: ActionTypes.ShowFlashMessage,
        });
    }
    public hideFlashMessage() {
        this._dispatch({
            type: ActionTypes.HideFlashMessage,
        });
    }
    public updateProviderType(providerType: ProviderType) {
        this._dispatch({
            type: ActionTypes.UpdateProviderType,
            data: providerType,
        });
    }
    public updateInjectedProviderName(injectedProviderName: string) {
        this._dispatch({
            type: ActionTypes.UpdateInjectedProviderName,
            data: injectedProviderName,
        });
    }
    public updateSelectedLanguage(language: Language) {
        this._dispatch({
            type: ActionTypes.UpdateSelectedLanguage,
            data: language,
        });
    }
}
