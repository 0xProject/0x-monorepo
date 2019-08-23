import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import styled from 'styled-components';

import { Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface IVersionPickerProps extends RouteComponentProps<IMatchParams> {
    versions: string[];
}

interface IMatchParams {
    page?: string;
    type?: string;
    version?: string;
}

const VersionSelect: React.FC<IVersionPickerProps> = ({ history, location, match, versions }) => {
    const { page, type, version: versionParam } = match.params;

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const version = e.target.value;
        const url = `/docs/${type}/${page}/${version}`;
        history.push(url);
        window.scrollTo(0, 0);
    };

    const getNumericVersion = (version: string) => version.replace(/^v/, '');

    return (
        <VersionPickerWrapper>
            <Paragraph color="#999" size={17} lineHeight={1.6} marginBottom="0">
                Version
            </Paragraph>
            <Container>
                <StyledSelect defaultValue={versionParam} onChange={onChange}>
                    {versionParam && (
                        <option hidden={true} value="">
                            {getNumericVersion(versionParam)}
                        </option>
                    )}
                    {versions.map((version: string) => (
                        <option key={version} value={version}>
                            {getNumericVersion(version)}
                        </option>
                    ))}
                </StyledSelect>
                <svg width="12" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 7l5-5 5 5" stroke={colors.brandDark} strokeWidth="1.5" />
                </svg>
            </Container>
        </VersionPickerWrapper>
    );
};

export const VersionPicker = withRouter(VersionSelect);

const VersionPickerWrapper = styled.div`
    display: flex;
    margin-bottom: 1rem;
`;

const Container = styled.div`
    border: 1px solid #e3e3e3;
    border-radius: 4px;
    display: inline-block;
    margin-left: 12px;
    position: relative;

    transition: all 250ms ease-in-out;
    &:hover {
        border-color: ${colors.brandDark};
    }

    svg {
        pointer-events: none;
        position: absolute;
        right: 8px;
        top: 50%;
        transform: rotate(180deg) translateY(50%);
    }
`;

const StyledSelect = styled.select`
    appearance: none;
    background-color: transparent;
    border: none;
    cursor: pointer;
    outline: none;
    color: ${colors.brandDark};
    font-family: 'Formular', monospace;
    font-feature-settings: 'tnum';
    font-size: 15px;
    line-height: 17px;
    padding: 4px 26px 4px 12px;
    width: 100%;
`;
