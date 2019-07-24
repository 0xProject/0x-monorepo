import styled from 'styled-components';

export const Columns = styled.div`
    display: grid;
    grid-template-columns: 290px 0 1fr;
    grid-column-gap: 30px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;
