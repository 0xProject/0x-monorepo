import { colors, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import FlatButton from 'material-ui/FlatButton';
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
                <div className="col col-12" style={{ ...styles.root, height: '100%' }}>
                    <div
                        className="relative sm-px2 sm-pt2 sm-m1"
                        style={{ height: 122, top: '33%', transform: 'translateY(-50%)' }}
                    >
                        <div className="center pb2">
                            {_.isUndefined(this.state.error) ? (
                                <CircularProgress size={40} thickness={5} />
                            ) : (
                                <Retry onRetry={this._fetchRelayerInfosAsync.bind(this)} />
                            )}
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div style={styles.root}>
                    <GridList
                        cellHeight={CELL_HEIGHT}
                        cols={NUMBER_OF_COLUMNS}
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
