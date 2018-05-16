import { colors, EtherscanLinkSuffixes, Styles, utils as sharedUtils } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { TokenIcon } from 'ts/components/ui/token_icon';
import { WebsiteBackendTokenInfo } from 'ts/types';

export interface TopTokensProps {
    tokens: WebsiteBackendTokenInfo[];
    networkId: number;
}

const styles: Styles = {
    tokenLabel: {
        textDecoration: 'none',
        color: colors.mediumBlue,
    },
    followingTokenLabel: {
        paddingLeft: 16,
    },
};

export const TopTokens: React.StatelessComponent<TopTokensProps> = (props: TopTokensProps) => {
    return (
        <div className="flex">
            {_.map(props.tokens, (tokenInfo: WebsiteBackendTokenInfo, index: number) => {
                const firstItemStyle = { ...styles.tokenLabel, ...styles.followingTokenLabel };
                const style = index !== 0 ? firstItemStyle : styles.tokenLabel;
                return <TokenLink tokenInfo={tokenInfo} style={style} networkId={props.networkId} />;
            })}
        </div>
    );
};

interface TokenLinkProps {
    tokenInfo: WebsiteBackendTokenInfo;
    style: React.CSSProperties;
    networkId: number;
}
interface TokenLinkState {
    isHovering: boolean;
}

class TokenLink extends React.Component<TokenLinkProps, TokenLinkState> {
    constructor(props: TokenLinkProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render(): React.ReactNode {
        const style = {
            ...this.props.style,
            cursor: 'pointer',
            opacity: this.state.isHovering ? 0.5 : 1,
        };
        return (
            <a
                key={this.props.tokenInfo.address}
                href={tokenLinkFromToken(this.props.tokenInfo, this.props.networkId)}
                target="_blank"
                style={style}
                onMouseEnter={this._onToggleHover.bind(this, true)}
                onMouseLeave={this._onToggleHover.bind(this, false)}
            >
                {this.props.tokenInfo.symbol}
            </a>
        );
    }
    private _onToggleHover(isHovering: boolean): void {
        this.setState({
            isHovering,
        });
    }
}

function tokenLinkFromToken(tokenInfo: WebsiteBackendTokenInfo, networkId: number): string {
    return sharedUtils.getEtherScanLinkIfExists(tokenInfo.address, networkId, EtherscanLinkSuffixes.Address);
}
