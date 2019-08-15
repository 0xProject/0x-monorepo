import styled from 'styled-components';

interface ISeparatorProps {
    margin?: string;
    marginMobile?: string;
}

export const Separator = styled.hr<ISeparatorProps>`
    border-width: 0 0 1px;
    border-color: #e4e4e4;
    height: 0;
    margin: ${({ margin }) => margin};

    @media (max-width: 768px) {
        margin: ${({ marginMobile }) => marginMobile};
    }
`;

Separator.defaultProps = {
    margin: '30px 0',
    marginMobile: '30px 0',
};
