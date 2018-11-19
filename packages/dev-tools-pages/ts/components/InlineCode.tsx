import * as React from 'react';
import styled from 'styled-components';

import { colors } from '../variables';

interface InlineCodeProps {
    isAlt?: boolean;
    children: React.ReactNode;
}

const Code: React.StatelessComponent<InlineCodeProps> = ({ isAlt, children, ...props }) => (
    <code {...props}>{children}</code>
);

const InlineCode = styled(Code)`
    background-color: ${props => (props.isAlt ? '#E5E8E9' : colors.blueGray)};
    padding: 0.3125rem;
`;

export { InlineCode };
