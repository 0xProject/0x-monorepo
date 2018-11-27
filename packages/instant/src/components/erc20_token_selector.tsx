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
    searchQuery?: string;
}

export class ERC20TokenSelector extends React.Component<ERC20TokenSelectorProps> {
    public state: ERC20TokenSelectorState = {
        searchQuery: undefined,
    };
    public render(): React.ReactNode {
        const { tokens, onTokenSelect } = this.props;
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
                    {_.map(tokens, token => {
                        if (!this._isTokenQueryMatch(token)) {
                            return null;
                        }
                        return <TokenSelectorRow key={token.assetData} token={token} onClick={onTokenSelect} />;
                    })}
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
    private readonly _isTokenQueryMatch = (token: ERC20Asset): boolean => {
        const { searchQuery } = this.state;
        if (_.isUndefined(searchQuery)) {
            return true;
        }
        const searchQueryLowerCase = searchQuery.toLowerCase();
        const tokenName = token.metaData.name.toLowerCase();
        const tokenSymbol = token.metaData.symbol.toLowerCase();
        return _.startsWith(tokenSymbol, searchQueryLowerCase) || _.startsWith(tokenName, searchQueryLowerCase);
    };
}

interface TokenSelectorRowProps {
    token: ERC20Asset;
    onClick: (token: ERC20Asset) => void;
}

class TokenSelectorRow extends React.Component<TokenSelectorRowProps> {
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

const TokenSelectorRowIcon: React.StatelessComponent<TokenSelectorRowIconProps> = props => {
    const { token } = props;
    const iconUrlIfExists = token.metaData.iconUrl;
    const TokenIcon = require(`../assets/icons/${token.metaData.symbol}.svg`);
    const displaySymbol = assetUtils.bestNameForAsset(token);
    if (!_.isUndefined(iconUrlIfExists)) {
        return <img src={iconUrlIfExists} />;
    } else if (!_.isUndefined(TokenIcon)) {
        return <TokenIcon />;
    } else {
        return (
            <Text fontColor={ColorOption.white} fontSize="8px">
                {displaySymbol}
            </Text>
        );
    }
};
