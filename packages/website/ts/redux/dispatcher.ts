import { BigNumber } from '@0x/utils';
import { Dispatch } from 'redux';
import { State } from 'ts/redux/reducer';
import {
    ActionTypes,
    AssetToken,
    BlockchainErrs,
    Language,
    PortalOrder,
    ProviderType,
    ScreenWidths,
    Side,
    SideToAssetToken,
    Token,
    TokenByAddress,
} from 'ts/types';

export class Dispatcher {
    private readonly _dispatch: Dispatch<State>;
    constructor(dispatch: Dispatch<State>) {
        this._dispatch = dispatch;
    }
    // Portal
    public resetState(): void {
        this._dispatch({
            type: ActionTypes.ResetState,
        });
    }
    public updateNodeVersion(nodeVersion: string): void {
        this._dispatch({
            data: nodeVersion,
            type: ActionTypes.UpdateNodeVersion,
        });
    }
    public updateScreenWidth(screenWidth: ScreenWidths): void {
        this._dispatch({
            data: screenWidth,
            type: ActionTypes.UpdateScreenWidth,
        });
    }
    public swapAssetTokenSymbols(): void {
        this._dispatch({
            type: ActionTypes.SwapAssetTokens,
        });
    }
    public updateOrderSalt(salt: BigNumber): void {
        this._dispatch({
            data: salt,
            type: ActionTypes.UpdateOrderSalt,
        });
    }
    public updateUserSuppliedOrderCache(order: PortalOrder): void {
        this._dispatch({
            data: order,
            type: ActionTypes.UpdateUserSuppliedOrderCache,
        });
    }
    public updateShouldBlockchainErrDialogBeOpen(shouldBeOpen: boolean): void {
        this._dispatch({
            data: shouldBeOpen,
            type: ActionTypes.UpdateShouldBlockchainErrDialogBeOpen,
        });
    }
    public updateChosenAssetToken(side: Side, token: AssetToken): void {
        this._dispatch({
            data: {
                side,
                token,
            },
            type: ActionTypes.UpdateChosenAssetToken,
        });
    }
    public updateChosenAssetTokenAddress(side: Side, address: string): void {
        this._dispatch({
            data: {
                address,
                side,
            },
            type: ActionTypes.UpdateChosenAssetTokenAddress,
        });
    }
    public updateOrderTakerAddress(address: string): void {
        this._dispatch({
            data: address,
            type: ActionTypes.UpdateOrderTakerAddress,
        });
    }
    public updateUserAddress(address?: string): void {
        this._dispatch({
            data: address,
            type: ActionTypes.UpdateUserAddress,
        });
    }
    public updateOrderExpiry(unixTimestampSec: BigNumber): void {
        this._dispatch({
            data: unixTimestampSec,
            type: ActionTypes.UpdateOrderExpiry,
        });
    }
    public encounteredBlockchainError(err: BlockchainErrs): void {
        this._dispatch({
            data: err,
            type: ActionTypes.BlockchainErrEncountered,
        });
    }
    public updateBlockchainIsLoaded(isLoaded: boolean): void {
        this._dispatch({
            data: isLoaded,
            type: ActionTypes.UpdateBlockchainIsLoaded,
        });
    }
    public addTokenToTokenByAddress(token: Token): void {
        this._dispatch({
            data: token,
            type: ActionTypes.AddTokenToTokenByAddress,
        });
    }
    public removeTokenToTokenByAddress(token: Token): void {
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
    ): void {
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
    public updateTokenByAddress(tokens: Token[]): void {
        this._dispatch({
            data: tokens,
            type: ActionTypes.UpdateTokenByAddress,
        });
    }
    public forceTokenStateRefetch(): void {
        this._dispatch({
            type: ActionTypes.ForceTokenStateRefetch,
        });
    }
    public updateSignature(signature: string): void {
        this._dispatch({
            data: signature,
            type: ActionTypes.UpdateOrderSignature,
        });
    }
    public updateUserWeiBalance(balance?: BigNumber): void {
        this._dispatch({
            data: balance,
            type: ActionTypes.UpdateUserEtherBalance,
        });
    }
    public updateNetworkId(networkId: number): void {
        this._dispatch({
            data: networkId,
            type: ActionTypes.UpdateNetworkId,
        });
    }
    public updateOrderFillAmount(amount: BigNumber): void {
        this._dispatch({
            data: amount,
            type: ActionTypes.UpdateOrderFillAmount,
        });
    }

    public updatePortalOnboardingShowing(isShowing: boolean): void {
        this._dispatch({
            data: isShowing,
            type: ActionTypes.UpdatePortalOnboardingShowing,
        });
    }

    // Docs
    public updateCurrentDocsVersion(version: string): void {
        this._dispatch({
            data: version,
            type: ActionTypes.UpdateLibraryVersion,
        });
    }
    public updateAvailableDocVersions(versions: string[]): void {
        this._dispatch({
            data: versions,
            type: ActionTypes.UpdateAvailableLibraryVersions,
        });
    }

    // Shared
    public showFlashMessage(msg: string | React.ReactNode): void {
        this._dispatch({
            data: msg,
            type: ActionTypes.ShowFlashMessage,
        });
    }
    public hideFlashMessage(): void {
        this._dispatch({
            type: ActionTypes.HideFlashMessage,
        });
    }
    public updateProviderType(providerType: ProviderType): void {
        this._dispatch({
            type: ActionTypes.UpdateProviderType,
            data: providerType,
        });
    }
    public updateInjectedProviderName(injectedProviderName: string): void {
        this._dispatch({
            type: ActionTypes.UpdateInjectedProviderName,
            data: injectedProviderName,
        });
    }
    public updateSelectedLanguage(language: Language): void {
        this._dispatch({
            type: ActionTypes.UpdateSelectedLanguage,
            data: language,
        });
    }
}
