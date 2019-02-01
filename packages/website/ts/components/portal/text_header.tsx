import { colors } from '@0x/react-shared';
import * as React from 'react';

import { Text } from 'ts/components/ui/text';

export interface TextHeaderProps {
    labelText: string;
}

export const TextHeader = (props: TextHeaderProps) => {
    return (
        <Text className="pt3 pb2" fontWeight="bold" fontSize="16px" fontColor={colors.darkestGrey}>
            {props.labelText}
        </Text>
    );
};
