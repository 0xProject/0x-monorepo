import * as React from 'react';

import { ColorOption } from '../style/theme';

import { BuyButton } from './buy_button';
import { InstantHeading } from './instant_heading';
import { OrderDetails } from './order_details';
import { Animation, Circle, Container, Flex, Text } from './ui';

export interface TokenSelectionProps {}

export const TokenSelection: React.StatelessComponent<TokenSelectionProps> = props => (
    <Container backgroundColor={ColorOption.white} padding="20px" width="100%">
        <Flex width="100%" direction="column" justify="flex-start" align="flex-start">
            <Container marginBottom="12px">
                <Text letterSpacing="1px" fontColor={ColorOption.black} fontWeight={600} fontSize="14px">
                    Select Token
                </Text>
            </Container>
            <div className="hello" style={{ flexGrow: 1, width: '100%', overflow: 'auto', backgroundColor: 'red' }}>
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
                <TokenSelectionRow />
            </div>
        </Flex>
    </Container>
);

interface TokenSelectionRowProps {
    // name: string;
    // primaryValue: string;
    // secondaryValue: string;
    // shouldEmphasize?: boolean;
}

const TokenSelectionRow: React.StatelessComponent<TokenSelectionRowProps> = props => {
    return (
        <Container padding="12px 0px" borderTop="1px solid" borderColor={ColorOption.feintGrey} width="100%">
            <Flex justify="flex-start">
                <Container marginRight="10px">
                    <Circle diameter={30} fillColor={ColorOption.black} />
                </Container>
                <Text fontWeight={700} fontColor={ColorOption.grey}>
                    ZRX -{' '}
                    <Text fontWeight={400} fontColor={ColorOption.grey}>
                        0x
                    </Text>
                </Text>
            </Flex>
        </Container>
    );
};
