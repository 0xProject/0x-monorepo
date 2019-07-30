import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { constants } from '../utils/constants';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/ethereum_types/introduction');
const InstallationMarkdown = require('md/docs/ethereum_types/installation');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    types: constants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.EthereumTypes,
    packageName: 'ethereum-types',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Ethereum Types',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/ethereum-types',
    markdownMenu: {
        'getting-started': [markdownSections.introduction, markdownSections.installation],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown,
            [markdownSections.installation]: InstallationMarkdown,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
