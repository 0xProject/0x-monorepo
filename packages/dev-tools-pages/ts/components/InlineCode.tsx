import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../variables';

interface InlineCodeProps {
    alt?: boolean;
    children: React.ReactNode;
}

const InlineCode = styled(({ alt, children, ...props }: InlineCodeProps) => <code {...props}>{children}</code>)`
    background-color: ${props => (props.alt ? '#E5E8E9' : colors.blueGray)};
    padding: 0.3125rem;
`;

export default InlineCode;
