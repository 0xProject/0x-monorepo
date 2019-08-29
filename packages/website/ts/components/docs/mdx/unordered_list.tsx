import styled from 'styled-components';

import { docs } from 'ts/style/docs';

export const UnorderedList = styled.ul`
    list-style-type: disc;
    margin-bottom: ${docs.marginBottom};
    padding-left: 1rem;

    li {
        color: ${docs.textColor};
        font-size: ${docs.fontSize.desktop};
        font-weight: 300;
        line-height: 1.625em;
        margin-bottom: 1rem;
        line-height: 1.4;

        @media (max-width: 900px) {
            font-size: ${docs.fontSize.mobile};
        }
    }
`;
