import styled from 'styled-components';

import { media } from 'ts/variables';

interface ContainerProps {
    wide?: boolean;
}

const Container =
    styled.div <
    ContainerProps >
    `
    max-width: 77.5rem;
    margin: 0 auto;
    width: ${props => (props.wide ? '100%' : 'calc(100% - 5rem)')};
`;

export default Container;
