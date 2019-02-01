import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as moment from 'moment';
import * as React from 'react';
import firstBy = require('thenby');

import { Blockchain } from 'ts/blockchain';
import { NewTokenForm } from 'ts/components/generate_order/new_token_form';
import { TrackTokenConfirmation } from 'ts/components/track_token_confirmation';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { Dispatcher } from 'ts/redux/dispatcher';
import { DialogConfigs, Token, TokenByAddress, TokenVisibility } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const TOKEN_ICON_DIMENSION = 100;
const TILE_DIMENSION = 146;
enum AssetViews {
    ASSET_PICKER = 'ASSET_PICKER',
    NEW_TOKEN_FORM = 'NEW_TOKEN_FORM',
    CONFIRM_TRACK_TOKEN = 'CONFIRM_TRACK_TOKEN',
}

interface AssetPickerProps {
    userAddress: string;
    blockchain: Blockchain;
    dispatcher: Dispatcher;
    networkId: number;
    isOpen: boolean;
    currentTokenAddress: string;
    onTokenChosen: (tokenAddress: string) => void;
    tokenByAddress: TokenByAddress;
    tokenVisibility?: TokenVisibility;
}

interface AssetPickerState {
    assetView: AssetViews;
    hoveredAddress: string | undefined;
    chosenTrackTokenAddress: string;
    isAddingTokenToTracked: boolean;
}

export class AssetPicker extends React.Component<AssetPickerProps, AssetPickerState> {
    public static defaultProps: Partial<AssetPickerProps> = {
        tokenVisibility: TokenVisibility.ALL,
    };
    private readonly _dialogConfigsByAssetView: { [assetView: string]: DialogConfigs };
    constructor(props: AssetPickerProps) {
        super(props);
        this.state = {
            assetView: AssetViews.ASSET_PICKER,
            hoveredAddress: undefined,
            chosenTrackTokenAddress: undefined,
            isAddingTokenToTracked: false,
        };
        this._dialogConfigsByAssetView = {
            [AssetViews.ASSET_PICKER]: {
                title: 'Select token',
                isModal: false,
                actions: [],
            },
            [AssetViews.NEW_TOKEN_FORM]: {
                title: 'Add an ERC20 token',
                isModal: false,
                actions: [],
            },
            [AssetViews.CONFIRM_TRACK_TOKEN]: {
                title: 'Tracking confirmation',
                isModal: true,
                actions: [
                    <FlatButton
                        key="noTracking"
                        label="No"
                        onClick={this._onTrackConfirmationRespondedAsync.bind(this, false)}
                    />,
                    <FlatButton
                        key="yesTrack"
                        label="Yes"
                        onClick={this._onTrackConfirmationRespondedAsync.bind(this, true)}
                    />,
                ],
            },
        };
    }
    public render(): React.ReactNode {
        const dialogConfigs: DialogConfigs = this._dialogConfigsByAssetView[this.state.assetView];
        return (
            <Dialog
                title={dialogConfigs.title}
                modal={dialogConfigs.isModal}
                open={this.props.isOpen}
                actions={dialogConfigs.actions}
                autoScrollBodyContent={true}
                onRequestClose={this._onCloseDialog.bind(this)}
            >
                {this.state.assetView === AssetViews.ASSET_PICKER && this._renderAssetPicker()}
                {this.state.assetView === AssetViews.NEW_TOKEN_FORM && (
                    <NewTokenForm
                        blockchain={this.props.blockchain}
                        onNewTokenSubmitted={this._onNewTokenSubmitted.bind(this)}
                        tokenByAddress={this.props.tokenByAddress}
                    />
                )}
                {this.state.assetView === AssetViews.CONFIRM_TRACK_TOKEN && this._renderConfirmTrackToken()}
            </Dialog>
        );
    }
    private _renderConfirmTrackToken(): React.ReactNode {
        const token = this.props.tokenByAddress[this.state.chosenTrackTokenAddress];
        return (
            <TrackTokenConfirmation
                tokens={[token]}
                tokenByAddress={this.props.tokenByAddress}
                networkId={this.props.networkId}
                isAddingTokenToTracked={this.state.isAddingTokenToTracked}
            />
        );
    }
    private _renderAssetPicker(): React.ReactNode {
        return (
            <div
                className="flex flex-wrap"
                style={{
                    maxWidth: 1000,
                    maxHeight: 600,
                    marginBottom: 10,
                }}
            >
                {this._renderGridTiles()}
            </div>
        );
    }
    private _renderGridTiles(): React.ReactNode {
        let isHovered;
        let tileStyles;
        const allTokens = _.values(this.props.tokenByAddress);
        // filter tokens based on visibility specified in props, do not show ZRX or ETHER as tracked or untracked
        const filteredTokens =
            this.props.tokenVisibility === TokenVisibility.ALL
                ? allTokens
                : _.filter(allTokens, token => {
                      return (
                          token.symbol !== constants.ZRX_TOKEN_SYMBOL &&
                          token.symbol !== constants.ETHER_TOKEN_SYMBOL &&
                          ((this.props.tokenVisibility === TokenVisibility.TRACKED && utils.isTokenTracked(token)) ||
                              (this.props.tokenVisibility === TokenVisibility.UNTRACKED &&
                                  !utils.isTokenTracked(token)))
                      );
                  });
        // if we are showing tracked tokens, sort by date added, otherwise sort by symbol
        const sortKey = this.props.tokenVisibility === TokenVisibility.TRACKED ? 'trackedTimestamp' : 'symbol';
        const sortedTokens = filteredTokens.sort(firstBy(sortKey));
        if (_.isEmpty(sortedTokens)) {
            return <div className="mx-auto p4 h2">No tokens to remove.</div>;
        }
        const gridTiles = _.map(sortedTokens, token => {
            const address = token.address;
            isHovered = this.state.hoveredAddress === address;
            tileStyles = {
                cursor: 'pointer',
                opacity: isHovered ? 0.6 : 1,
            };
            return (
                <div
                    key={address}
                    style={{
                        width: TILE_DIMENSION,
                        height: TILE_DIMENSION,
                        ...tileStyles,
                    }}
                    className="p2 flex sm-col-6 md-col-3 lg-col-3 flex-column items-center mx-auto"
                    onClick={this._onChooseToken.bind(this, address)}
                    onMouseEnter={this._onToggleHover.bind(this, address, true)}
                    onMouseLeave={this._onToggleHover.bind(this, address, false)}
                >
                    <div className="p1">
                        <TokenIcon token={token} diameter={TOKEN_ICON_DIMENSION} />
                    </div>
                    <div className="center">{token.symbol}</div>
                </div>
            );
        });
        const otherTokenKey = 'otherToken';
        isHovered = this.state.hoveredAddress === otherTokenKey;
        tileStyles = {
            cursor: 'pointer',
            opacity: isHovered ? 0.6 : 1,
        };
        if (this.props.tokenVisibility !== TokenVisibility.TRACKED) {
            gridTiles.push(
                <div
                    key={otherTokenKey}
                    style={{
                        width: TILE_DIMENSION,
                        height: TILE_DIMENSION,
                        ...tileStyles,
                    }}
                    className="p2 flex sm-col-6 md-col-3 lg-col-3 flex-column items-center mx-auto"
                    onClick={this._onCustomAssetChosen.bind(this)}
                    onMouseEnter={this._onToggleHover.bind(this, otherTokenKey, true)}
                    onMouseLeave={this._onToggleHover.bind(this, otherTokenKey, false)}
                >
                    <div className="p1 center">
                        <i
                            style={{ fontSize: 105, paddingLeft: 1, paddingRight: 1 }}
                            className="zmdi zmdi-plus-circle"
                        />
                    </div>
                    <div className="center">Other ERC20 Token</div>
                </div>,
            );
        }
        return gridTiles;
    }
    private _onToggleHover(address: string, isHovered: boolean): void {
        const hoveredAddress = isHovered ? address : undefined;
        this.setState({
            hoveredAddress,
        });
    }
    private _onCloseDialog(): void {
        this.setState({
            assetView: AssetViews.ASSET_PICKER,
        });
        this.props.onTokenChosen(this.props.currentTokenAddress);
    }
    private _onChooseToken(tokenAddress: string): void {
        const token = this.props.tokenByAddress[tokenAddress];
        if (utils.isTokenTracked(token)) {
            this.props.onTokenChosen(tokenAddress);
        } else {
            this.setState({
                assetView: AssetViews.CONFIRM_TRACK_TOKEN,
                chosenTrackTokenAddress: tokenAddress,
            });
        }
    }
    private _onCustomAssetChosen(): void {
        this.setState({
            assetView: AssetViews.NEW_TOKEN_FORM,
        });
    }
    private _onNewTokenSubmitted(newToken: Token): void {
        trackedTokenStorage.addTrackedTokenToUser(this.props.userAddress, this.props.networkId, newToken);
        this.props.dispatcher.addTokenToTokenByAddress(newToken);
        this.setState({
            assetView: AssetViews.ASSET_PICKER,
        });
        this.props.onTokenChosen(newToken.address);
    }
    private async _onTrackConfirmationRespondedAsync(didUserAcceptTracking: boolean): Promise<void> {
        const resetState: AssetPickerState = {
            ...this.state,
            isAddingTokenToTracked: false,
            assetView: AssetViews.ASSET_PICKER,
            chosenTrackTokenAddress: undefined,
        };
        if (!didUserAcceptTracking) {
            this.setState(resetState);
            this._onCloseDialog();
            return;
        }
        this.setState({
            isAddingTokenToTracked: true,
        });
        const tokenAddress = this.state.chosenTrackTokenAddress;
        const token = this.props.tokenByAddress[tokenAddress];
        if (_.isUndefined(tokenAddress)) {
            this.setState(resetState);
            return;
        }
        const newTokenEntry = {
            ...token,
            trackedTimestamp: moment().unix(),
        };
        trackedTokenStorage.addTrackedTokenToUser(this.props.userAddress, this.props.networkId, newTokenEntry);

        this.props.dispatcher.updateTokenByAddress([newTokenEntry]);
        this.setState(resetState);
        this.props.onTokenChosen(tokenAddress);
    }
}
