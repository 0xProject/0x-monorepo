import { colors, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import { GridTile } from 'material-ui/GridList';
import * as React from 'react';

import { TopTokens } from 'ts/components/relayer_index/relayer_top_tokens';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { Token, WebsiteBackendRelayerInfo } from 'ts/types';

export interface RelayerGridTileProps {
    relayerInfo: WebsiteBackendRelayerInfo;
    networkId: number;
}

// TODO: Get top tokens and headerurl from remote
const headerUrl = '/images/og_image.png';
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

const styles: Styles = {
    root: {
        backgroundColor: colors.white,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        boxShadow: `0px 4px 6px ${colors.walletBoxShadow}`,
        overflow: 'hidden',
        boxSizing: 'border-box',
    },
    innerDiv: {
        padding: 6,
        height: '100%',
        boxSizing: 'border-box',
    },
    header: {
        height: '50%',
        width: '100%',
        objectFit: 'cover',
        borderBottomRightRadius: 4,
        borderBottomLeftRadius: 4,
        borderTopRightRadius: 4,
        borderTopLeftRadius: 4,
    },
    body: {
        paddingLeft: 6,
        paddingRight: 6,
        height: '50%',
        width: '100%',
        boxSizing: 'border-box',
    },
    dailyTradeVolumeLabel: {
        fontSize: 14,
        color: colors.mediumBlue,
    },
    subLabel: {
        fontSize: 12,
        color: colors.lightGrey,
    },
    relayerNameLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.black,
    },
};

export const RelayerGridTile: React.StatelessComponent<RelayerGridTileProps> = (props: RelayerGridTileProps) => {
    return (
        <GridTile style={styles.root}>
            <div style={styles.innerDiv}>
                <img src={headerUrl} style={styles.header} />
                <div style={styles.body}>
                    <div className="py1" style={styles.relayerNameLabel}>
                        {props.relayerInfo.name}
                    </div>
                    <div style={styles.dailyTradeVolumeLabel}>{props.relayerInfo.dailyTxnVolume}</div>
                    <div className="py1" style={styles.subLabel}>
                        Daily Trade Volume
                    </div>
                    <TopTokens tokens={topTokens} networkId={props.networkId} />
                    <div className="py1" style={styles.subLabel}>
                        Top tokens
                    </div>
                </div>
            </div>
        </GridTile>
    );
};
