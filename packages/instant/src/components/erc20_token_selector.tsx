import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { ERC20Asset } from '../types';
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
                <SearchInput
                    placeholder="Search tokens..."
                    width="100%"
                    value={this.state.searchQuery}
                    onChange={this._handleSearchInputChange}
                />
                <Container overflow="scroll" height="calc(100% - 80px)" marginTop="10px">
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
    };
    private readonly _isTokenQueryMatch = (token: ERC20Asset): boolean => {
        const { searchQuery } = this.state;
        if (_.isUndefined(searchQuery)) {
            return true;
        }
        const stringToSearch = `${token.metaData.name} ${token.metaData.symbol}`;
        return _.includes(stringToSearch.toLowerCase(), searchQuery.toLowerCase());
    };
}

interface TokenSelectorRowProps {
    token: ERC20Asset;
    onClick: (token: ERC20Asset) => void;
}

class TokenSelectorRow extends React.Component<TokenSelectorRowProps> {
    public render(): React.ReactNode {
        const { token } = this.props;
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
                            <Circle diameter={30} rawColor={token.metaData.primaryColor}>
                                <Flex height="100%">
                                    <Text fontColor={ColorOption.white} fontSize="8px">
                                        {displaySymbol}
                                    </Text>
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
