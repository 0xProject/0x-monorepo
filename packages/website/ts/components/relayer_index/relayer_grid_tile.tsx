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
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: colors.walletBorder,
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

const FALLBACK_IMG_SRC = '/images/landing/hero_chip_image.png';

export const RelayerGridTile: React.StatelessComponent<RelayerGridTileProps> = (props: RelayerGridTileProps) => {
    const link = props.relayerInfo.appUrl || props.relayerInfo.url;
    return (
        <GridTile style={styles.root}>
            <div style={styles.innerDiv}>
                <a href={link} target="_blank" style={{ textDecoration: 'none' }}>
                    <ImgWithFallback
                        src={props.relayerInfo.headerImgUrl}
                        fallbackSrc={FALLBACK_IMG_SRC}
                        style={styles.header}
                    />
                </a>
                <div style={styles.body}>
                    <div className="py1" style={styles.relayerNameLabel}>
                        {props.relayerInfo.name}
                    </div>
                    <div style={styles.dailyTradeVolumeLabel}>{props.relayerInfo.dailyTxnVolume}</div>
                    <div className="py1" style={styles.subLabel}>
                        Daily Trade Volume
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

interface ImgWithFallbackProps {
    src?: string;
    fallbackSrc: string;
    style: React.CSSProperties;
}
interface ImgWithFallbackState {
    imageLoadFailed: boolean;
}
class ImgWithFallback extends React.Component<ImgWithFallbackProps, ImgWithFallbackState> {
    constructor(props: ImgWithFallbackProps) {
        super(props);
        this.state = {
            imageLoadFailed: false,
        };
    }
    public render(): React.ReactNode {
        if (this.state.imageLoadFailed || _.isUndefined(this.props.src)) {
            return <img src={this.props.fallbackSrc} style={this.props.style} />;
        } else {
            return <img src={this.props.src} onError={this._onError.bind(this)} style={this.props.style} />;
        }
    }
    private _onError(): void {
        this.setState({
            imageLoadFailed: true,
        });
    }
}
