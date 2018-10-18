import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Pulse } from './animations/pulse';

import { Text } from './ui';

export interface AmountPlaceholderProps {
    pulsating: boolean;
}

const PlainPlaceholder = () => (
    <Text fontWeight="bold" fontColor={ColorOption.white}>
        &mdash;
    </Text>
);

export const AmountPlaceholder: React.StatelessComponent<AmountPlaceholderProps> = props => {
    if (props.pulsating) {
        return (
            <Pulse>
                <PlainPlaceholder />
            </Pulse>
        );
    } else {
        return <PlainPlaceholder />;
    }
};
