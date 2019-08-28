import styled from 'styled-components';
import { Heading } from 'ts/components/text';

const MDXHeading = styled(Heading)`
    position: relative;

    &:hover {
        .heading-link-icon {
            opacity: 1;
        }
    }

    .heading-link-icon {
        display: inline-block;
        width: 16px;
        height: 16px;

        position: absolute;
        transform: translateY(-50%);
        top: 50%;
        left: -26px;
        padding-right: 26px;

        opacity: 0;
        transition: opacity 200ms ease-in-out;

        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' %3E%3Cpath d='M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3M8 12h8'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
    }
`;

const H1 = styled(MDXHeading).attrs({
    size: 34,
    asElement: 'h1',
    marginBottom: '1rem',
})`
    /* @TODO: adjust the heading size variables in global styles instead of using custom size here */
    @media (max-width: 768px) {
        font-size: 20px !important;
    }
`;

const H2 = styled(MDXHeading).attrs({
    size: 'default',
    asElement: 'h2',
    marginBottom: '1rem',
})``;

const H3 = styled(MDXHeading).attrs({
    size: 'small',
    asElement: 'h3',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

const H4 = styled(MDXHeading).attrs({
    asElement: 'h4',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

const H5 = styled(MDXHeading).attrs({
    asElement: 'h5',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

const H6 = styled(MDXHeading).attrs({
    asElement: 'h6',
    fontWeight: '300',
    marginBottom: '1rem',
})``;

export { H1, H2, H3, H4, H5, H6 };
