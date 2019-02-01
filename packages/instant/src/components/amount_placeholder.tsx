import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Pulse } from './animations/pulse';

import { Text } from './ui/text';

interface PlainPlaceholder {
    color: ColorOption;
}
const PlainPlaceholder: React.StatelessComponent<PlainPlaceholder> = props => (
    <Text fontWeight="bold" fontColor={props.color}>
        &mdash;
    </Text>
);

export interface AmountPlaceholderProps {
    color: ColorOption;
    isPulsating: boolean;
}
export const AmountPlaceholder: React.StatelessComponent<AmountPlaceholderProps> = props => {
    if (props.isPulsating) {
        return (
            <Pulse>
                <PlainPlaceholder color={props.color} />
            </Pulse>
        );
    } else {
        return <PlainPlaceholder color={props.color} />;
    }
};
