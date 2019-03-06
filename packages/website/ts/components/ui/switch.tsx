import * as React from 'react';
import styled, { withTheme } from 'styled-components';

import { Heading } from 'ts/components/text';

const SwitchWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
`;

export interface SwitchProps {
    label: string;
}

export const Switch = (props: SwitchProps) => {
    return <SwitchWrapper>
        <Heading isNoMargin={true} asElement="h3" size={'small'}>{props.label}</Heading>
    </SwitchWrapper>;
};
