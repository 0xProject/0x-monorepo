import * as React from 'react';
import { render } from 'react-dom';
import { MetaTags } from 'ts/components/meta_tags';
import { Landing } from 'ts/pages/landing';

import 'basscss/css/basscss.css';

const DOCUMENT_TITLE = '';
const DOCUMENT_DESCRIPTION = '';

render(
    <div>
        <MetaTags title={DOCUMENT_TITLE} description={DOCUMENT_DESCRIPTION} />
        <Landing />
    </div>,
    document.getElementById('app'),
);
