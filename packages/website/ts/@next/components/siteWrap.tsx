import * as React from 'react';
import { GlobalStyles } from 'ts/@next/constants/globalStyle';


interface Props {

}

const SiteWrap:React.StatelessComponent<Props> = props => {
  const { children } = props;

  return (
    <>
      <GlobalStyles />

      <header>0x HEADER</header>

      { children }

      <footer>OMG FOOTER</footer>
    </>
  )
};


export { SiteWrap }
