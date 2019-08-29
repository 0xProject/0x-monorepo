import styled from 'styled-components';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

export const OrderedList = styled.ol`
    list-style: none;
    counter-reset: steps;
    margin-bottom: ${docs.marginBottom};

    li {
        position: relative;
        counter-increment: steps;
        padding-left: 48px;
        margin-bottom: 0.8333rem;
        color: ${colors.brandDark};
        font-size: ${docs.fontSize.desktop};
        line-height: 30px;

        &:before {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            left: 0;
            content: counter(steps);
            border-radius: 50%;
            background-color: rgba(0, 174, 153, 0.1);
            min-width: 30px;
            height: 30px;
        }

        @media (max-width: 900px) {
            font-size: ${docs.fontSize.mobile};
        }
    }
`;
