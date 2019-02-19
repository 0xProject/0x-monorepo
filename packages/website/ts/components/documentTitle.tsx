import * as React from 'react';
import { Helmet } from 'react-helmet';

export interface DocumentTitleProps {
    title: string;
}

export const DocumentTitle: React.StatelessComponent<DocumentTitleProps> = ({ title }) => (
    <Helmet>
        <title>{title}</title>
    </Helmet>
);
