import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { ERC20Asset } from '../types';
import { analytics } from '../util/analytics';
import { assetUtils } from '../util/asset';

import { SearchInput } from './search_input';
import { Circle } from './ui/circle';
import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface ERC20TokenSelectorProps {
    tokens: ERC20Asset[];
    onTokenSelect: (token: ERC20Asset) => void;
}

export interface ERC20TokenSelectorState {
    searchQuery: string;
}

export class ERC20TokenSelector extends React.PureComponent<ERC20TokenSelectorProps> {
    public state: ERC20TokenSelectorState = {
        searchQuery: '',
    };
    public render(): React.ReactNode {
        const { tokens } = this.props;
        return (
            <Container height="100%">
                <Container marginBottom="10px">
                    <Text fontColor={ColorOption.darkGrey} fontSize="18px" fontWeight="600" lineHeight="22px">
                        Select Token
                    </Text>
                </Container>
                <SearchInput
                    placeholder="Search tokens..."
                    width="100%"
                    value={this.state.searchQuery}
                    onChange={this._handleSearchInputChange}
                    tabIndex={-1}
                />
                <Container overflow="scroll" height="calc(100% - 90px)" marginTop="10px">
                    <TokenRowFilter
                        tokens={tokens}
                        onClick={this._handleTokenClick}
                        searchQuery={this.state.searchQuery}
                    />
                </Container>
            </Container>
        );
    }
    private readonly _handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const searchQuery = event.target.value;
        this.setState({
            searchQuery,
        });
        analytics.trackTokenSelectorSearched(searchQuery);
    };
    private readonly _handleTokenClick = (token: ERC20Asset): void => {
        this.props.onTokenSelect(token);
    };
}

interface TokenRowFilterProps {
    tokens: ERC20Asset[];
    onClick: (token: ERC20Asset) => void;
    searchQuery: string;
}

class TokenRowFilter extends React.Component<TokenRowFilterProps> {
    public render(): React.ReactNode {
        return _.map(this.props.tokens, token => {
            if (!this._isTokenQueryMatch(token)) {
                return null;
            }
            return <TokenSelectorRow key={token.assetData} token={token} onClick={this.props.onClick} />;
        });
    }
    public shouldComponentUpdate(nextProps: TokenRowFilterProps): boolean {
        const arePropsDeeplyEqual = _.isEqual(nextProps, this.props);
        return !arePropsDeeplyEqual;
    }
    private readonly _isTokenQueryMatch = (token: ERC20Asset): boolean => {
        const { searchQuery } = this.props;
        const searchQueryLowerCase = searchQuery.toLowerCase().trim();
        if (searchQueryLowerCase === '') {
            return true;
        }
        const tokenName = token.metaData.name.toLowerCase();
        const tokenSymbol = token.metaData.symbol.toLowerCase();
        return _.startsWith(tokenSymbol, searchQueryLowerCase) || _.startsWith(tokenName, searchQueryLowerCase);
    };
}

interface TokenSelectorRowProps {
    token: ERC20Asset;
    onClick: (token: ERC20Asset) => void;
}

class TokenSelectorRow extends React.PureComponent<TokenSelectorRowProps> {
    public render(): React.ReactNode {
        const { token } = this.props;
        const circleColor = token.metaData.primaryColor || 'black';
        const displaySymbol = assetUtils.bestNameForAsset(token);
        return (
            <Container
                padding="12px 0px"
                borderBottom="1px solid"
                borderColor={ColorOption.feintGrey}
                backgroundColor={ColorOption.white}
                width="100%"
                onClick={this._handleClick}
                darkenOnHover={true}
                cursor="pointer"
            >
                <Container marginLeft="5px">
                    <Flex justify="flex-start">
                        <Container marginRight="10px">
                            <Circle diameter={26} rawColor={circleColor}>
                                <Flex height="100%" width="100%">
                                    <TokenSelectorRowIcon token={token} />
                                </Flex>
                            </Circle>
                        </Container>
                        <Text fontSize="14px" fontWeight={700} fontColor={ColorOption.black}>
                            {displaySymbol}
                        </Text>
                        <Container margin="0px 5px">
                            <Text fontSize="14px"> - </Text>
                        </Container>
                        <Text fontSize="14px">{token.metaData.name}</Text>
                    </Flex>
                </Container>
            </Container>
        );
    }
    private readonly _handleClick = (): void => {
        this.props.onClick(this.props.token);
    };
}

interface TokenSelectorRowIconProps {
    token: ERC20Asset;
}

const getTokenIcon = (symbol: string): React.StatelessComponent | undefined => {
    try {
        return require(`../assets/icons/${symbol}.svg`).default as React.StatelessComponent;
    } catch (e) {
        // Can't find icon
        return undefined;
    }
};

class TokenSelectorRowIcon extends React.PureComponent<TokenSelectorRowIconProps> {
    public render(): React.ReactNode {
        const { token } = this.props;
        const iconUrlIfExists = token.metaData.iconUrl;

        const TokenIcon = getTokenIcon(token.metaData.symbol);
        const displaySymbol = assetUtils.bestNameForAsset(token);
        if (iconUrlIfExists !== undefined) {
            return <img src={iconUrlIfExists} />;
        } else if (TokenIcon !== undefined) {
            return <TokenIcon />;
        } else {
            return (
                <Text fontColor={ColorOption.white} fontSize="8px">
                    {displaySymbol}
                </Text>
            );
        }
    }
}
