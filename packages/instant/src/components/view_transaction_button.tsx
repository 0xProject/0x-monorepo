import * as React from 'react';

import { SecondaryButton } from './secondary_button';

export interface ViewTransactionButtonProps {
    onClick: () => void;
}

export const ViewTransactionButton: React.StatelessComponent<ViewTransactionButtonProps> = props => {
    return <SecondaryButton onClick={props.onClick}>View Transaction</SecondaryButton>;
};
