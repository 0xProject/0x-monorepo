import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Button, ButtonProps } from './ui/button';

export interface SecondaryButtonProps extends ButtonProps {}

export const SecondaryButton: React.StatelessComponent<SecondaryButtonProps> = props => {
    const buttonProps = _.omit(props, 'text');
    return (
        <Button
            backgroundColor={ColorOption.white}
            borderColor={ColorOption.lightGrey}
            width={props.width}
            onClick={props.onClick}
            fontColor={ColorOption.primaryColor}
            fontSize="16px"
            {...buttonProps}
        >
            {props.children}
        </Button>
    );
};
SecondaryButton.defaultProps = {
    width: '100%',
};
