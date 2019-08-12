import styled from 'styled-components';
import { Heading } from 'ts/components/text';

const H1 = styled(Heading).attrs({
    size: 34,
    asElement: 'h1',
    marginBottom: '1rem',
})`
    /* @TODO: adjust the heading size variables in global styles instead of using custom size here */
    @media (max-width: 768px) {
        font-size: 20px !important;
    }
`;

const H2 = styled(Heading).attrs({
    size: 'default',
    asElement: 'h2',
    marginBottom: '1rem',
})``;

const H3 = styled(Heading).attrs({
    size: 'small',
    asElement: 'h3',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

const H4 = styled(Heading).attrs({
    asElement: 'h4',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

const H5 = styled(Heading).attrs({
    asElement: 'h5',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

const H6 = styled(Heading).attrs({
    asElement: 'h6',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

export { H1, H2, H3, H4, H5, H6 };
