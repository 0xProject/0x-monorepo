import * as React from 'react';
import styled from 'styled-components';

import { Footer } from 'ts/@next/components/footer';
import { Header } from 'ts/@next/components/header';
import { Main } from 'ts/@next/components/layout';
import { GlobalStyles } from 'ts/@next/constants/globalStyle';

// Note(ez): We'll define the theme and provide it via a prop
// e.g. theme dark/light/etc.
interface Props {

}

const SiteWrap: React.StatelessComponent<Props> = props => {
  const { children } = props;

  return (
    <>
      {/* GlobalStyles will be exposed the theme via provider,
          same is true for all children of SiteWrap
      */}
      <GlobalStyles />

      <Header />

      <Main>
        { children }
      </Main>

      <Footer/>
    </>
  );
};


export { SiteWrap };
