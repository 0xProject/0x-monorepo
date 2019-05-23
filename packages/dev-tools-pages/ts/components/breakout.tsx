import styled from 'styled-components';

import { media } from 'ts/variables';

const Breakout = styled.div`
    ${media.small`
        margin-left: -2.5rem;
        width: calc(100% + 5rem);
  `};
`;

export { Breakout };
