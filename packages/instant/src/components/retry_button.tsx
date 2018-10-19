import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Button, Text } from './ui';

export interface RetryButtonProps {
    onClick: () => void;
}

export const RetryButton: React.StatelessComponent<RetryButtonProps> = props => {
    return (
        <Button
            backgroundColor={ColorOption.white}
            borderColor={ColorOption.lightGrey}
            width="100%"
            onClick={props.onClick}
        >
            <Text fontColor={ColorOption.primaryColor} fontWeight={600} fontSize="16px">
                Try Again
            </Text>
        </Button>
    );
};
