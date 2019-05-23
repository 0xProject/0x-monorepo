import * as React from 'react';
import { Helmet } from 'react-helmet';

import { DocumentMetadata } from '../utils/document_meta_constants';

export interface DocumentTitleProps extends DocumentMetadata {}

export const DocumentTitle: React.StatelessComponent<DocumentTitleProps> = ({ title, description }) => (
    <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
    </Helmet>
);
