import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { ERC20Asset } from '../types';
import { assetUtils } from '../util/asset';

import { SearchInput } from './search_input';
import { Circle, Container, Flex, Text } from './ui';

export interface ERC20TokenSelectorProps {
    tokens: ERC20Asset[];
    onTokenSelect: (token: ERC20Asset) => void;
}

export const ERC20TokenSelector: React.StatelessComponent<ERC20TokenSelectorProps> = ({ tokens, onTokenSelect }) => (
    <Container>
        <SearchInput placeholder="Search tokens..." width="100%" />
        <Container overflow="scroll" height="325px" marginTop="10px">
            {_.map(tokens, token => <TokenSelectorRow key={token.assetData} token={token} onClick={onTokenSelect} />)}
        </Container>
    </Container>
);

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
                            <Circle diameter={30} fillColor={token.metaData.primaryColor}>
                                <Flex height="100%">
                                    <Text fontColor={ColorOption.white} fontSize="8px">
                                        {displaySymbol}
                                    </Text>
                                </Flex>
                            </Circle>
                        </Container>
                        <Text fontWeight={700} fontColor={ColorOption.black}>
                            {displaySymbol}
                        </Text>
                        <Container margin="0px 5px">
                            <Text> - </Text>
                        </Container>
                        <Text>{token.metaData.name}</Text>
                    </Flex>
                </Container>
            </Container>
        );
    }
    private readonly _handleClick = (): void => {
        this.props.onClick(this.props.token);
    };
}
