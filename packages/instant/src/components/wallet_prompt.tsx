import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface WalletPromptProps {
    image: React.ReactNode;
    onClick?: () => void;
}

export const WalletPrompt: React.StatelessComponent<WalletPromptProps> = ({ onClick, image, children }) => (
    <Container
        padding="14.5px"
        border={`1px solid ${ColorOption.darkOrange}`}
        backgroundColor={ColorOption.lightOrange}
        width="100%"
        borderRadius="4px"
        onClick={onClick}
        cursor={onClick ? 'pointer' : undefined}
        boxShadowOnHover={!!onClick}
    >
        <Flex>
            <Container marginRight="10px">{image}</Container>
            <Text fontSize="16px" fontColor={ColorOption.darkOrange}>
                {children}
            </Text>
        </Flex>
    </Container>
);
