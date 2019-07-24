import React from 'react';
import styled from 'styled-components';

import CircularProgress from 'material-ui/CircularProgress';

import { Hero } from 'ts/components/docs/hero';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { colors } from 'ts/style/colors';

interface IDocsPageLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    loading?: boolean;
    isHome?: boolean;
}

export const DocsPageLayout: React.FC<IDocsPageLayoutProps> = props => {
    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero title={props.title} subtitle={props.subtitle} isHome={props.isHome} />
            <Section maxWidth="1150px" isPadded={false} overflow="visible">
                {props.loading ? (
                    <LoaderWrapper>
                        <CircularProgress size={40} thickness={2} color={colors.brandLight} />
                    </LoaderWrapper>
                ) : (
                    props.children
                )}
            </Section>
        </SiteWrap>
    );
};

const LoaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
`;

// const Columns = styled.div`
//     display: grid;
//     grid-template-columns: 130px 0 1fr;
//     grid-column-gap: 60px;

//     @media (min-width: 1440px) {
//         grid-template-columns: 230px 0 1fr;
//     }

//     @media (max-width: 900px) {
//         grid-template-columns: 1fr;
//     }
// `;
