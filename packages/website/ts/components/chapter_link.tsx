import { NavLink as ReactRouterLink } from 'react-router-dom';
import styled from 'styled-components';

export const ChapterLink = styled(ReactRouterLink).attrs({
    activeStyle: { opacity: 1 },
})`
    font-size: 1.222222222rem;
    display: block;
    opacity: 0.5;
    margin-bottom: 1.666666667rem;

    &:hover {
        opacity: 1;
    }
`;
