import BigNumber from 'bignumber.js';
import {Dispatch} from 'redux';
import {State} from 'ts/redux/reducer';
import {
    ActionTypes,
    AssetToken,
    BlockchainErrs,
    Order,
    ProviderType,
    ScreenWidths,
    Side,
    SignatureData,
    Token,
    TokenStateByAddress,
} from 'ts/types';

export class Dispatcher {
    private dispatch: Dispatch<State>;
    constructor(dispatch: Dispatch<State>) {
        this.dispatch = dispatch;
    }
    // Portal
    public resetState() {
        this.dispatch({
            type: ActionTypes.ResetState,
        });
    }
    public updateNodeVersion(nodeVersion: string) {
        this.dispatch({
            data: nodeVersion,
            type: ActionTypes.UpdateNodeVersion,
        });
    }
    public updateScreenWidth(screenWidth: ScreenWidths) {
        this.dispatch({
            data: screenWidth,
            type: ActionTypes.UpdateScreenWidth,
        });
    }
    public swapAssetTokenSymbols() {
        this.dispatch({
            type: ActionTypes.SwapAssetTokens,
        });
    }
    public updateOrderSalt(salt: BigNumber) {
        this.dispatch({
            data: salt,
            type: ActionTypes.UpdateOrderSalt,
        });
    }
    public updateUserSuppliedOrderCache(order: Order) {
        this.dispatch({
            data: order,
            type: ActionTypes.UpdateUserSuppliedOrderCache,
        });
    }
    public updateShouldBlockchainErrDialogBeOpen(shouldBeOpen: boolean) {
        this.dispatch({
            data: shouldBeOpen,
            type: ActionTypes.UpdateShouldBlockchainErrDialogBeOpen,
        });
    }
    public updateChosenAssetToken(side: Side, token: AssetToken) {
        this.dispatch({
            data: {
                side,
                token,
            },
            type: ActionTypes.UpdateChosenAssetToken,
        });
    }
    public updateChosenAssetTokenAddress(side: Side, address: string) {
        this.dispatch({
            data: {
                address,
                side,
            },
            type: ActionTypes.UpdateChosenAssetTokenAddress,
        });
    }
    public updateOrderTakerAddress(address: string) {
        this.dispatch({
            data: address,
            type: ActionTypes.UpdateOrderTakerAddress,
        });
    }
    public updateUserAddress(address: string) {
        this.dispatch({
            data: address,
            type: ActionTypes.UpdateUserAddress,
        });
    }
    public updateOrderExpiry(unixTimestampSec: BigNumber) {
        this.dispatch({
            data: unixTimestampSec,
            type: ActionTypes.UpdateOrderExpiry,
        });
    }
    public encounteredBlockchainError(err: BlockchainErrs) {
        this.dispatch({
             data: err,
             type: ActionTypes.BlockchainErrEncountered,
         });
    }
    public updateBlockchainIsLoaded(isLoaded: boolean) {
        this.dispatch({
             data: isLoaded,
             type: ActionTypes.UpdateBlockchainIsLoaded,
         });
    }
    public addTokenToTokenByAddress(token: Token) {
        this.dispatch({
             data: token,
             type: ActionTypes.AddTokenToTokenByAddress,
         });
    }
    public removeTokenToTokenByAddress(token: Token) {
        this.dispatch({
             data: token,
             type: ActionTypes.RemoveTokenFromTokenByAddress,
         });
    }
    public clearTokenByAddress() {
        this.dispatch({
            type: ActionTypes.ClearTokenByAddress,
         });
    }
    public updateTokenByAddress(tokens: Token[]) {
        this.dispatch({
             data: tokens,
             type: ActionTypes.UpdateTokenByAddress,
         });
    }
    public updateTokenStateByAddress(tokenStateByAddress: TokenStateByAddress) {
        this.dispatch({
             data: tokenStateByAddress,
             type: ActionTypes.UpdateTokenStateByAddress,
         });
    }
    public removeFromTokenStateByAddress(tokenAddress: string) {
        this.dispatch({
            data: tokenAddress,
            type: ActionTypes.RemoveFromTokenStateByAddress,
        });
    }
    public replaceTokenAllowanceByAddress(address: string, allowance: BigNumber) {
        this.dispatch({
            data: {
              address,
              allowance,
            },
            type: ActionTypes.ReplaceTokenAllowanceByAddress,
        });
    }
    public replaceTokenBalanceByAddress(address: string, balance: BigNumber) {
        this.dispatch({
            data: {
                address,
                balance,
            },
            type: ActionTypes.ReplaceTokenBalanceByAddress,
        });
    }
    public updateTokenBalanceByAddress(address: string, balanceDelta: BigNumber) {
        this.dispatch({
            data: {
                address,
                balanceDelta,
            },
            type: ActionTypes.UpdateTokenBalanceByAddress,
        });
    }
    public updateSignatureData(signatureData: SignatureData) {
        this.dispatch({
             data: signatureData,
             type: ActionTypes.UpdateOrderSignatureData,
         });
    }
    public updateUserEtherBalance(balance: BigNumber) {
        this.dispatch({
             data: balance,
             type: ActionTypes.UpdateUserEtherBalance,
         });
    }
    public updateNetworkId(networkId: number) {
        this.dispatch({
             data: networkId,
             type: ActionTypes.UpdateNetworkId,
         });
    }
    public updateOrderFillAmount(amount: BigNumber) {
        this.dispatch({
            data: amount,
            type: ActionTypes.UpdateOrderFillAmount,
        });
    }

    // Docs
    public updateCurrentDocsVersion(version: string) {
        this.dispatch({
            data: version,
            type: ActionTypes.UpdateLibraryVersion,
        });
    }
    public updateAvailableDocVersions(versions: string[]) {
        this.dispatch({
            data: versions,
            type: ActionTypes.UpdateAvailableLibraryVersions,
        });
    }

    // Shared
    public showFlashMessage(msg: string|React.ReactNode) {
        this.dispatch({
            data: msg,
            type: ActionTypes.ShowFlashMessage,
        });
    }
    public hideFlashMessage() {
        this.dispatch({
            type: ActionTypes.HideFlashMessage,
        });
    }
    public updateProviderType(providerType: ProviderType) {
        this.dispatch({
            type: ActionTypes.UpdateProviderType,
            data: providerType,
        });
    }
    public updateInjectedProviderName(injectedProviderName: string) {
        this.dispatch({
            type: ActionTypes.UpdateInjectedProviderName,
            data: injectedProviderName,
        });
    }
}
