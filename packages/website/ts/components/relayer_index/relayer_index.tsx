import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import { GridList } from 'material-ui/GridList';
import * as React from 'react';

import { RelayerGridTile, RelayerGridTileStyle } from 'ts/components/relayer_index/relayer_grid_tile';
import { Retry } from 'ts/components/ui/retry';
import { ScreenWidths, WebsiteBackendRelayerInfo } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';

export enum RelayerIndexCellStyle {
    Expanded = 0,
    Minimized,
}

export interface RelayerIndexProps {
    networkId: number;
    screenWidth: ScreenWidths;
    cellStyle: RelayerIndexCellStyle;
}

interface RelayerIndexState {
    relayerInfos?: WebsiteBackendRelayerInfo[];
    error?: Error;
}

const CELL_HEIGHT_EXPANDED = 290;
const CELL_HEIGHT_MINIMIZED = 225;
const NUMBER_OF_COLUMNS_LARGE = 3;
const NUMBER_OF_COLUMNS_MEDIUM = 2;
const NUMBER_OF_COLUMNS_SMALL = 2;
const GRID_PADDING = 20;

export const RelayerIndex: React.FC<RelayerIndexProps> = props => {
    const [state, setState] = React.useState<RelayerIndexState>({ error: undefined, relayerInfos: undefined });
    const isUnmounted = React.useRef(false);

    React.useEffect(() => {
        // tslint:disable-next-line:no-floating-promises
        fetchRelayerInfosAsync();

        return () => (isUnmounted.current = true);
    }, []);

    const fetchRelayerInfosAsync = async (): Promise<void> => {
        try {
            if (!isUnmounted.current) {
                setState({ relayerInfos: undefined, error: undefined });
            }

            const relayerInfos = await backendClient.getRelayerInfosAsync();

            if (!isUnmounted.current) {
                setState({ ...state, relayerInfos });
            }
        } catch (error) {
            if (!isUnmounted.current) {
                setState({ ...state, error });
            }
        }
    };

    const isReadyToRender = state.error === undefined && state.relayerInfos !== undefined;

    if (!isReadyToRender) {
        return (
            // TODO: consolidate this loading component with the one in portal and OpenPositions
            // TODO: possibly refactor into a generic loading container with spinner and retry UI
            <div className="center">
                {state.error === undefined ? (
                    <CircularProgress size={40} thickness={5} />
                ) : (
                    <Retry onRetry={fetchRelayerInfosAsync} />
                )}
            </div>
        );
    } else {
        const numberOfRelayers = state.relayerInfos.length;
        const numberOfColumns = Math.min(numberOfRelayers, numberOfColumnsForScreenWidth(props.screenWidth));
        const isExpanded = props.cellStyle === RelayerIndexCellStyle.Expanded;
        const cellHeight = isExpanded ? CELL_HEIGHT_EXPANDED : CELL_HEIGHT_MINIMIZED;
        const gridTileStyle = isExpanded ? RelayerGridTileStyle.Expanded : RelayerGridTileStyle.Minimized;
        return (
            <GridList
                cellHeight={cellHeight}
                cols={numberOfColumns}
                padding={GRID_PADDING}
                style={{ marginTop: -10, marginBottom: 0 }}
            >
                {state.relayerInfos.map((relayerInfo: WebsiteBackendRelayerInfo, index) => (
                    <RelayerGridTile
                        key={index}
                        relayerInfo={relayerInfo}
                        networkId={props.networkId}
                        style={gridTileStyle}
                    />
                ))}
            </GridList>
        );
    }
};

function numberOfColumnsForScreenWidth(screenWidth: ScreenWidths): number {
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
