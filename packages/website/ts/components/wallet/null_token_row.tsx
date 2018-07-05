import * as React from 'react';

import { Circle } from 'ts/components/ui/circle';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { PlaceHolder } from 'ts/components/wallet/placeholder';
import { StandardIconRow } from 'ts/components/wallet/standard_icon_row';
import { colors } from 'ts/style/colors';

export interface NullTokenRowProps {
    iconDimension: number;
    fillColor: string;
}

export const NullTokenRow: React.StatelessComponent<NullTokenRowProps> = ({ iconDimension, fillColor }) => {
    const icon = <Circle diameter={iconDimension} fillColor={fillColor} />;
    const main = (
        <div className="flex flex-column">
            <PlaceHolder hideChildren={true} fillColor={fillColor}>
                <Text fontSize="16px" fontWeight="bold" lineHeight="1em">
                    0.00 XXX
                </Text>
            </PlaceHolder>
            <Container marginTop="3px">
                <PlaceHolder hideChildren={true} fillColor={fillColor}>
                    <Text fontSize="14px" fontColor={colors.darkGrey} lineHeight="1em">
                        $0.00
                    </Text>
                </PlaceHolder>
            </Container>
        </div>
    );
    const accessory = (
        <Container marginRight="12px">
            <PlaceHolder hideChildren={true} fillColor={fillColor}>
                <Container width="20px" height="14px" />
            </PlaceHolder>
        </Container>
    );
    return <StandardIconRow icon={icon} main={main} accessory={accessory} />;
};
