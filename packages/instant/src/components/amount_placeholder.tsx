import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Pulse } from './animations/pulse';

import { Text } from './ui';

export interface PlainPlaceholder {
    color: ColorOption;
}
export const PlainPlaceholder: React.StatelessComponent<PlainPlaceholder> = props => (
    <Text fontWeight="bold" fontColor={props.color}>
        &mdash;
    </Text>
);

export interface AmountPlaceholderProps {
    color: ColorOption;
    pulsating: boolean;
}
export const AmountPlaceholder: React.StatelessComponent<AmountPlaceholderProps> = props => {
    if (props.pulsating) {
        return (
            <Pulse>
                <PlainPlaceholder color={props.color} />
            </Pulse>
        );
    } else {
        return <PlainPlaceholder color={props.color} />;
    }
};
