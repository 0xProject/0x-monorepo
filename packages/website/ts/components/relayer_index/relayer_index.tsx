import { colors, Styles } from '@0xproject/react-shared';
import { GridList } from 'material-ui/GridList';
import * as React from 'react';

import { RelayerGridTile } from 'ts/components/relayer_index/relayer_grid_tile';
import { RelayerInfo } from 'ts/types';

export interface RelayerIndexProps {
    networkId: number;
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

// TODO: replace fake data with real, remote data
const topTokens = [
    {
        address: '0x1dad4783cf3fe3085c1426157ab175a6119a04ba',
        decimals: 18,
        iconUrl: '/images/token_icons/makerdao.png',
        isRegistered: true,
        isTracked: true,
        name: 'Maker DAO',
        symbol: 'MKR',
    },
    {
        address: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
        decimals: 18,
        iconUrl: '/images/token_icons/melon.png',
        isRegistered: true,
        isTracked: true,
        name: 'Melon Token',
        symbol: 'MLN',
    },
    {
        address: '0xb18845c260f680d5b9d84649638813e342e4f8c9',
        decimals: 18,
        iconUrl: '/images/token_icons/augur.png',
        isRegistered: true,
        isTracked: true,
        name: 'Augur Reputation Token',
        symbol: 'REP',
    },
];

const relayerInfos: RelayerInfo[] = [
    {
        id: '1',
        headerUrl: '/images/og_image.png',
        name: 'Radar Relay',
        marketShare: 0.5,
        topTokens,
    },
    {
        id: '2',
        headerUrl: '/images/og_image.png',
        name: 'Paradex',
        marketShare: 0.5,
        topTokens,
    },
    {
        id: '3',
        headerUrl: '/images/og_image.png',
        name: 'yo',
        marketShare: 0.5,
        topTokens,
    },
    {
        id: '4',
        headerUrl: '/images/og_image.png',
        name: 'test',
        marketShare: 0.5,
        topTokens,
    },
    {
        id: '5',
        headerUrl: '/images/og_image.png',
        name: 'blahg',
        marketShare: 0.5,
        topTokens,
    },
    {
        id: '6',
        headerUrl: '/images/og_image.png',
        name: 'hello',
        marketShare: 0.5,
        topTokens,
    },
];

const CELL_HEIGHT = 260;
const NUMBER_OF_COLUMNS = 4;
const GRID_PADDING = 16;

export const RelayerIndex: React.StatelessComponent<RelayerIndexProps> = (props: RelayerIndexProps) => {
    return (
        <div style={styles.root}>
            <GridList cellHeight={CELL_HEIGHT} cols={NUMBER_OF_COLUMNS} padding={GRID_PADDING} style={styles.gridList}>
                {relayerInfos.map((relayerInfo: RelayerInfo) => (
                    <RelayerGridTile key={relayerInfo.id} relayerInfo={relayerInfo} networkId={props.networkId} />
                ))}
            </GridList>
        </div>
    );
};
