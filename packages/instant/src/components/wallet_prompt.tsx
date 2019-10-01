import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Text } from './ui/text';

export interface WalletPromptProps {
    image?: React.ReactNode;
    onClick?: () => void;
    primaryColor: ColorOption;
    secondaryColor: ColorOption;
    marginTop?: string;
}

export const WalletPrompt: React.StatelessComponent<WalletPromptProps> = ({
    onClick,
    image,
    children,
    secondaryColor,
    primaryColor,
    marginTop,
}) => (
    <Container
        padding="10px"
        border={`1px solid`}
        borderColor={primaryColor}
        backgroundColor={secondaryColor}
        width="100%"
        borderRadius="4px"
        onClick={onClick}
        cursor={onClick ? 'pointer' : undefined}
        boxShadowOnHover={!!onClick}
        marginTop={marginTop}
    >
        <Flex>
            {image}
            <Container marginLeft="10px">
                <Text fontSize="16px" fontColor={primaryColor} fontWeight="500">
                    {children}
                </Text>
            </Container>
        </Flex>
    </Container>
);

WalletPrompt.defaultProps = {
    primaryColor: ColorOption.darkOrange,
    secondaryColor: ColorOption.lightOrange,
};

WalletPrompt.displayName = 'WalletPrompt';
