import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Button, ButtonProps } from './ui/button';
import { Text } from './ui/text';

export interface SecondaryButtonProps extends ButtonProps {}

// TODO: don't hard code this
export const SecondaryButton: React.StatelessComponent<SecondaryButtonProps> = props => {
    const buttonProps = _.omit(props, 'text');
    return (
        <Button
            backgroundColor={ColorOption.white}
            borderColor={ColorOption.lightGrey}
            width={props.width}
            onClick={props.onClick}
            {...buttonProps}
        >
            <Text fontColor={ColorOption.primaryColor} fontWeight={600} fontSize="16px">
                {props.children}
            </Text>
        </Button>
    );
};
SecondaryButton.defaultProps = {
    width: '100%',
};
