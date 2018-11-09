import * as React from 'react';
import { Helmet } from 'react-helmet';

export interface MetaTagsProps {
    title: string;
    description: string;
    imgSrc?: string;
}

export const MetaTags: React.StatelessComponent<MetaTagsProps> = ({ title, description, imgSrc }) => (
    <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={imgSrc} />
        <meta name="twitter:site" content="@0xproject" />
        <meta name="twitter:image" content={imgSrc} />
    </Helmet>
);

MetaTags.defaultProps = {
    imgSrc: '/images/og_image.png',
};
