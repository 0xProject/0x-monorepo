import * as React from 'react';
import styled from 'styled-components';

interface Props {
    icon: any;
    size?: any;
}

const StyledIcon = styled.div`
    margin: auto;
    flex-shrink: 0;

    ${(props: Props) => props.size && `
    width: ${props.size}; height: auto;
    `}
`;

export const Icon: React.StatelessComponent = ({ icon, ...props }) => (
    <>
        <StyledIcon as={icon as 'svg'} {...props} />
    </>
);
