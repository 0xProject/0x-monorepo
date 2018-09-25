import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import { GridList } from 'material-ui/GridList';
import * as React from 'react';

import { RelayerGridTile } from 'ts/components/relayer_index/relayer_grid_tile';
import { Retry } from 'ts/components/ui/retry';
import { ScreenWidths, WebsiteBackendRelayerInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';

export interface RelayerIndexProps {
    networkId: number;
    screenWidth: ScreenWidths;
}

interface RelayerIndexState {
    relayerInfos?: WebsiteBackendRelayerInfo[];
    error?: Error;
}

const CELL_HEIGHT = 290;
const NUMBER_OF_COLUMNS_LARGE = 3;
const NUMBER_OF_COLUMNS_MEDIUM = 2;
const NUMBER_OF_COLUMNS_SMALL = 2;
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
        const isReadyToRender = _.isUndefined(this.state.error) && !_.isUndefined(this.state.relayerInfos);
        if (!isReadyToRender) {
            return (
                // TODO: consolidate this loading component with the one in portal and OpenPositions
                // TODO: possibly refactor into a generic loading container with spinner and retry UI
                <div className="center">
                    {_.isUndefined(this.state.error) ? (
                        <CircularProgress size={40} thickness={5} />
                    ) : (
                        <Retry onRetry={this._fetchRelayerInfosAsync.bind(this)} />
                    )}
                </div>
            );
        } else {
            const numberOfRelayers = this.state.relayerInfos.length;
            const numberOfColumns = Math.min(
                numberOfRelayers,
                this._numberOfColumnsForScreenWidth(this.props.screenWidth),
            );
            return (
                <GridList
                    cellHeight={CELL_HEIGHT}
                    cols={numberOfColumns}
                    padding={GRID_PADDING}
                    style={{ marginTop: -10, marginBottom: 0 }}
                >
                    {this.state.relayerInfos.map((relayerInfo: WebsiteBackendRelayerInfo, index) => (
                        <RelayerGridTile key={index} relayerInfo={relayerInfo} networkId={this.props.networkId} />
                    ))}
                </GridList>
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
