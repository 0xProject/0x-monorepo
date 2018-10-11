import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Button, Container, Text } from './ui';

export interface BuyButtonProps {}

export const BuyButton: React.StatelessComponent<BuyButtonProps> = props => (
    <Container padding="20px" width="100%">
        <Button width="100%">
            <Text fontColor={ColorOption.white} fontWeight={600} fontSize="20px">
                Buy
            </Text>
        </Button>
    </Container>
);

BuyButton.displayName = 'BuyButton';
