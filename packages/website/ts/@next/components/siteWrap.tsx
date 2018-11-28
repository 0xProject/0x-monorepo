import * as React from 'react';
import { GlobalStyles } from 'ts/@next/constants/globalStyle';

import { Header } from './header';

interface Props {

}

const SiteWrap: React.StatelessComponent<Props> = props => {
  const { children } = props;

  return (
    <>
      <GlobalStyles />

      <Header />

      {children}

      <footer>OMG FOOTER</footer>
    </>
  );
};

export { SiteWrap };
