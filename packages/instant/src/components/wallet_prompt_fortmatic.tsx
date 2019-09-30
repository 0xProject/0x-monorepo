import * as React from 'react';

import {Container} from './ui/container';
import {Flex} from './ui/flex';
import {Text} from './ui/text';
import {Icon} from "./ui/icon";
import {ColorOption} from "../style/theme";

export interface WalletPromptFortmaticProps {
    onClick?: () => void;
}

export const WalletPromptFortmatic: React.StatelessComponent<WalletPromptFortmaticProps> = ({
    onClick
}) => (
    <Container
        padding="10px"
        border={`3px solid ${ColorOption.fortmaticPrimary}`}
        backgroundColor={ColorOption.fortmaticSecondary}
        width="100%"
        borderRadius="4px"
        onClick={onClick}
        cursor={onClick ? 'pointer' : undefined}
        boxShadowOnHover={!!onClick}
        marginTop="5px"
    >
        <Flex>
            <Container marginLeft="10px">
                <Text fontSize="16px" fontColor={ColorOption.fortmaticPrimary} fontWeight="500">
                    Connect with  <Icon width={13} icon="fortmatic" /> Fortmatic
                </Text>
            </Container>
        </Flex>
    </Container>
);


WalletPromptFortmatic.displayName = 'WalletPromptFortmatic';
