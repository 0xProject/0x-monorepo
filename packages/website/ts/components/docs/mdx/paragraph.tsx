import styled from 'styled-components';

import { docs } from 'ts/style/docs';

export const Paragraph = styled.p`
    color: ${docs.textColor};
    font-size: ${docs.fontSize.desktop};
    font-weight: 300;
    line-height: 1.6;
    margin-bottom: 30px;

    @media (max-width: 900px) {
        font-size: ${docs.fontSize.mobile};
    }
`;
