import { Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import FlatButton from 'material-ui/FlatButton';
import { GridList } from 'material-ui/GridList';
import * as React from 'react';

import { RelayerGridTile } from 'ts/components/relayer_index/relayer_grid_tile';
import { ScreenWidths, WebsiteBackendRelayerInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { colors } from 'ts/utils/colors';

export interface RelayerIndexProps {
    networkId: number;
    screenWidth: ScreenWidths;
}

interface RelayerIndexState {
    relayerInfos?: WebsiteBackendRelayerInfo[];
    error?: Error;
}

const styles: Styles = {
    root: {
        width: '100%',
    },
    item: {
        backgroundColor: colors.white,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        boxShadow: `0px 4px 6px ${colors.walletBoxShadow}`,
        overflow: 'hidden',
        padding: 4,
    },
};

const CELL_HEIGHT = 290;
const NUMBER_OF_COLUMNS_LARGE = 4;
const NUMBER_OF_COLUMNS_MEDIUM = 3;
const NUMBER_OF_COLUMNS_SMALL = 1;
const GRID_PADDING = 20;

export class RelayerIndex extends React.Component<RelayerIndexProps, RelayerIndexState> {
    private _isUnmounted: boolean;
    constructor(props: RelayerIndexProps) {
        super(props);
        this._isUnmounted = false;
        this.state = {
            relayerInfos: undefined,
            error: undefined,
        };
    }
    public componentWillMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._fetchRelayerInfosAsync();
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public render(): React.ReactNode {
        const readyToRender = _.isUndefined(this.state.error) && !_.isUndefined(this.state.relayerInfos);
        if (!readyToRender) {
            return (
                // TODO: consolidate this loading component with the one in portal
                <div className="center">
                    {_.isUndefined(this.state.error) ? (
                        <CircularProgress size={40} thickness={5} />
                    ) : (
                        <Retry onRetry={this._fetchRelayerInfosAsync.bind(this)} />
                    )}
                </div>
            );
        } else {
            const numberOfColumns = this._numberOfColumnsForScreenWidth(this.props.screenWidth);
            return (
                <div style={styles.root}>
                    <GridList
                        cellHeight={CELL_HEIGHT}
                        cols={numberOfColumns}
                        padding={GRID_PADDING}
                        style={styles.gridList}
                    >
                        {this.state.relayerInfos.map((relayerInfo: WebsiteBackendRelayerInfo, index) => (
                            <RelayerGridTile key={index} relayerInfo={relayerInfo} networkId={this.props.networkId} />
                        ))}
                    </GridList>
                </div>
            );
        }
    }
    private async _fetchRelayerInfosAsync(): Promise<void> {
        try {
            if (!this._isUnmounted) {
                this.setState({
                    relayerInfos: undefined,
                    error: undefined,
                });
            }
            const relayerInfos = await backendClient.getRelayerInfosAsync();
            if (!this._isUnmounted) {
                this.setState({
                    relayerInfos,
                });
            }
        } catch (error) {
            if (!this._isUnmounted) {
                this.setState({
                    error,
                });
            }
        }
    }
    private _numberOfColumnsForScreenWidth(screenWidth: ScreenWidths): number {
        switch (screenWidth) {
            case ScreenWidths.Md:
                return NUMBER_OF_COLUMNS_MEDIUM;
            case ScreenWidths.Sm:
                return NUMBER_OF_COLUMNS_SMALL;
            case ScreenWidths.Lg:
            default:
                return NUMBER_OF_COLUMNS_LARGE;
        }
    }
}

interface RetryProps {
    onRetry: () => void;
}
const Retry = (props: RetryProps) => (
    <div className="clearfix center" style={{ color: colors.black }}>
        <div className="mx-auto inline-block align-middle" style={{ lineHeight: '44px', textAlign: 'center' }}>
            <div className="h2" style={{ fontFamily: 'Roboto Mono' }}>
                Something went wrong.
            </div>
            <div className="py3">
                <FlatButton
                    label={'reload'}
                    backgroundColor={colors.black}
                    labelStyle={{
                        fontSize: 18,
                        fontFamily: 'Roboto Mono',
                        fontWeight: 'lighter',
                        color: colors.white,
                        textTransform: 'lowercase',
                    }}
                    style={{ width: 280, height: 62, borderRadius: 5 }}
                    onClick={props.onRetry}
                />
            </div>
        </div>
    </div>
);
