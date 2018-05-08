import { colors, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import { GridList } from 'material-ui/GridList';
import * as React from 'react';

import { RelayerGridTile } from 'ts/components/relayer_index/relayer_grid_tile';
import { WebsiteBackendRelayerInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';

export interface RelayerIndexProps {
    networkId: number;
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
const NUMBER_OF_COLUMNS = 4;
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
    public componentWillMount() {
        // tslint:disable-next-line:no-floating-promises
        this._fetchRelayerInfosAsync();
    }
    public componentWillUnmount() {
        this._isUnmounted = true;
    }
    public render() {
        const readyToRender = _.isUndefined(this.state.error) && !_.isUndefined(this.state.relayerInfos);
        if (readyToRender) {
            return (
                <div style={styles.root}>
                    <GridList
                        cellHeight={CELL_HEIGHT}
                        cols={NUMBER_OF_COLUMNS}
                        padding={GRID_PADDING}
                        style={styles.gridList}
                    >
                        {this.state.relayerInfos.map((relayerInfo: WebsiteBackendRelayerInfo) => (
                            <RelayerGridTile
                                key={relayerInfo.name}
                                relayerInfo={relayerInfo}
                                networkId={this.props.networkId}
                            />
                        ))}
                    </GridList>
                </div>
            );
        } else {
            // TODO: loading and error states with a scrolling container
            return null;
        }
    }
    private async _fetchRelayerInfosAsync(): Promise<void> {
        try {
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
}
