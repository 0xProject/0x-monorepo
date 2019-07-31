import styled from 'styled-components';

import { docs} from 'ts/style/docs';

export const OrderedList = styled.ol`
    list-style-type: none;
    counter-reset: tutorialSteps;
    margin-bottom:  ${docs.marginBottom};

    li {
        display: flex;
        counter-increment: tutorialSteps;
        margin-bottom: 0.8333rem;
        font-size: 1rem;
        line-height: 30px;
    }

    li:before {
        border-radius: 50%;
        background-color: rgba(0, 174, 153, 0.1);
        content: counter(tutorialSteps);
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 30px;
        height: 30px;
        margin-right: 1rem;
    }
`;
