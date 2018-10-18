import * as React from 'react';
import { Helmet } from 'react-helmet';

import { withContext, Props } from './withContext';

interface MetaTagsProps extends Props {
    imgSrc?: string;
}

function MetaTags(props: MetaTagsProps) {
    const { title, imgSrc = '/images/og_image.png' } = props;
    const description = props.tagline;
    return (
        <Helmet>
            <title>{props.title}</title>
            <meta name="description" content={description} />
            <link rel="shortcut icon" href={`/favicons/${props.name}.ico`} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:image" content={imgSrc} />
            <meta name="twitter:site" content="@0xproject" />
            <meta name="twitter:image" content={imgSrc} />
        </Helmet>
    );
}

export default withContext(MetaTags);
