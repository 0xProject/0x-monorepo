import * as React from 'react';
import styled from 'styled-components';

interface Props {
    icon: any;
    size?: string;
}

export const IconClass: React.FunctionComponent<Props> = (props: Props) => {
    return (
        <div />
    );
};

export const Icon = styled(IconClass)`
    margin: auto;
    flex-shrink: 0;

    ${(props: Props) => props.size && `
        width: ${props.size};
        height: auto;
    `}
`;
