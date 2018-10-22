import styled from 'styled-components';

import { media } from 'ts/variables';

const Breakout = styled.div`
    ${media.small`
        margin-left: -30px;
        width: calc(100% + 60px);
  `};
`;

export default Breakout;
