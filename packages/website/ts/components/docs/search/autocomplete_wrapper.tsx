import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface IWrapperProps {
    isHome?: boolean;
    currentRefinement?: string;
}

export const AutocompleteWrapper = styled.div<IWrapperProps>`
    position: relative;
    min-width: 240px;
    z-index: ${({ currentRefinement }) => currentRefinement && 500};

    ${({ isHome }) =>
        isHome &&
        `
        width: calc(100% - 60px);
        max-width: 900px;
        margin: 0 auto;
    `};

    .react-autosuggest__container {
        &--open,
        &--focused {
            background-color: ${colors.white};
        }

        ${({ isHome }) =>
            isHome &&
            `
            border: 1px solid transparent;
            padding: 13px 30px 0;

            &--focused,
            &--open {
                border: 1px solid #dbdfdd;
            }

            @media (max-width: 900px) {
                padding: 13px 18px;
            }
        `};
    }

    .react-autosuggest__input {
        background: url("data:image/svg+xml,%3Csvg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff' fill-opacity='.01' d='M0 0h24v24H0z'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0zM10.5 3a7.5 7.5 0 1 0 4.55 13.463l4.743 4.744 1.414-1.414-4.744-4.744A7.5 7.5 0 0 0 10.5 3z' fill='%235C5C5C'/%3E%3C/svg%3E")
            transparent left center no-repeat;
        font-size: 22px;
        padding: 18px 18px 21px 35px;
        width: 100%;

        outline: none;
        border: 1px solid transparent;

        ${({ isHome }) =>
            isHome &&
            `
            border-bottom-color: #b4bebd;

            &--focused,
            &--open {
                border-bottom-color: ${colors.brandLight};
            }
        `};

        ${({ isHome }) =>
            !isHome &&
            `
            background-color: #EBEEEC;
            padding: 13px 21px 15px 52px;
            background-position: left 21px center;
            font-size: 1rem;

            transition: all 300ms ease-in-out;

            @media (min-width: 1200px) {
                position: absolute;
                right: 30px;
                top: -24px;
                width: 240px;
            }

            &--focused,
            &--open {
                background-color: white;
                border: 1px solid #dbdfdd;
                border-bottom-color: ${colors.brandLight};

                @media (min-width: 1200px) {
                    width: 750px;
                }
            }
        `};

        &:before {
            content: '';
            width: 30px;
            height: 30px;
            opacity: 0.15;
            position: absolute;
            top: 0;
            left: 0;
        }
    }

    .react-autosuggest__section-container {
        display: flex;

        @media (max-width: 900px) {
            flex-direction: column;
        }
    }

    .react-autosuggest__section-title {
        position: relative;

        p {
            position: absolute;
            width: max-content;
            color: ${colors.brandDark};
            background-color: rgba(0, 56, 49, 0.1);
            border-radius: 4px;
            font-size: 12px;
            text-align: center;
            text-transform: uppercase;
            top: 0px;
            margin: 30px;
            padding: 4px 10px 2px;
            line-height: 1.4;
        }

        @media (max-width: 900px) {
            p {
                position: static;
                margin: 0;
                padding: 10px 18px 8px;
                border-radius: 0;
                width: 100%;
            }
        }
    }

    .react-autosuggest__suggestions-container {
        position: absolute;

        background-color: ${colors.white};
        flex-grow: 1;

        max-height: calc(100vh - 200px);
        overflow-y: auto;

        /* Slim scroll bar */
        scrollbar-color: ${colors.grey500} transparent;
        scrollbar-width: thin; /* Firefox */
        -ms-overflow-style: none; /* IE 10+ */
        &::-webkit-scrollbar {
            width: 1px;
            background: transparent; /* Chrome/Safari/Webkit */
        }

        &--focused,
        &--open {
            border: 1px solid #dbdfdd;
            border-top: none;
        }

        ${({ isHome }) =>
            isHome &&
            `
            right: 0;
            left: 0;
            top: 81px;
        `};

        ${({ isHome }) =>
            !isHome &&
            `
            width: 100%;

            @media (min-width: 1200px) {
                width: 750px;
                right: 30px;
                top: 28px;
            }
        `};
    }

    .react-autosuggest__suggestions-list {
        flex-grow: 1;
        width: 100%;
    }

    .react-autosuggest__suggestion {
        @media (max-width: 900px) {
            border-bottom: 1px solid #eee;
            margin-right: 0;
        }

        &--highlighted {
            background: ${colors.backgroundLight};

            .ais-Highlight {
                position: relative;

                &:before {
                    position: absolute;
                    content: '';
                    background: url("data:image/svg+xml,%3Csvg width='8' height='12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7.071 5.657L1.414 0 0 1.414l4.244 4.244L0 9.9l1.414 1.414L7.071 5.66v-.002z' fill='%23003831'/%3E%3C/svg%3E")
                        transparent left center no-repeat;
                    left: -16px;
                    height: 18px;
                    width: 8px;
                }
            }
        }

        /* Link - container */
        a {
            display: flex;
            flex-direction: column;
            min-height: 110px;

            padding: 25px 30px 25px 180px;

            @media (max-width: 900px) {
                padding: 25px 18px;
                margin-right: 0;
            }
        }

        .ais-Highlight {
            margin-bottom: 12px;

            /* Highlight - Text */
            h6 {
                display: inline;
                color: ${colors.brandDark};
                font-size: var(--smallHeading);
                font-weight: 300;
            }
            /* Highlight - Match */
            em {
                font-size: var(--smallHeading);
                font-weight: 400;
            }
        }

        .ais-Snippet {
            /* Snippet - Text */
            p {
                display: inline;
                color: ${colors.textDarkSecondary};
                font-size: var(--smallParagraph);
                font-weight: 300;
                line-height: 1.4;
            }

            /* Snippet - Match */
            span {
                font-size: var(--smallParagraph);
                font-weight: 400;
            }
        }
    }
`;
