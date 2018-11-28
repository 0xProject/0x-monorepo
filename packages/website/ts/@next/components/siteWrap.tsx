import * as React from 'react';
import styled from 'styled-components';
import { GlobalStyles } from 'ts/@next/constants/globalStyle';
import { Header } from 'ts/@next/components/header';


interface Props {

}

const SiteWrap: React.StatelessComponent<Props> = props => {
  const { children } = props;

  return (
    <>
      <GlobalStyles />

      <Header />

      <Main>
        { children }
      </Main>

      <footer>OMG FOOTER</footer>
    </>
  );
};

const Main = styled.main`
  border: 1px solid blue;
  width: calc(100% - 60px);
  max-width: 1500px;
  margin: 0 auto;
`;


export { SiteWrap }
