import { colors, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import { GridTile } from 'material-ui/GridList';
import * as React from 'react';

import { TopTokens } from 'ts/components/relayer_index/relayer_top_tokens';
import { TokenIcon } from 'ts/components/ui/token_icon';
import { RelayerInfo, Token } from 'ts/types';

export interface RelayerGridTileProps {
    relayerInfo: RelayerInfo;
    networkId: number;
}

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
    marketShareBar: {
        height: 14,
        width: '100%',
        backgroundColor: colors.mediumBlue,
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
                <img src={props.relayerInfo.headerUrl} style={styles.header} />
                <div style={styles.body}>
                    <div className="py1" style={styles.relayerNameLabel}>
                        {props.relayerInfo.name}
                    </div>
                    <div style={styles.marketShareBar} />
                    <div className="py1" style={styles.subLabel}>
                        Market share
                    </div>
                    <TopTokens tokens={props.relayerInfo.topTokens} networkId={props.networkId} />
                    <div className="py1" style={styles.subLabel}>
                        Top tokens
                    </div>
                </div>
            </div>
        </GridTile>
    );
};
