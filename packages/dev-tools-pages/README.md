## Dev tools pages

This repository contains our dev tools pages.

## Local Dev Setup

Requires Node version 6.9.5 or higher & yarn v1.9.4

### 1. Install dependencies for monorepo:

Make sure you install Yarn v1.9.4 (npm won't work!). We rely on our `yarn.lock` file and on Yarn's support for `workspaces` in our monorepo setup.

```bash
yarn install
```

### 2. Initial setup

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0x/dev-tools-pages yarn build
```

Note: Ignore the `WARNING in asset size limit` and `WARNING in entrypoint size limit` warnings.

### 3. Run dev server

```bash
cd packages/dev-tools-pages
yarn dev
```

Visit [http://localhost:3572/](http://localhost:3572/) in your browser.

The webpage will refresh when source code is changed.

### 4. Code!

There are some basic primitives we'd like you to use:

1.  `<Container>Stuff</Container>`: Use containers instead of divs,spans,etc... and use it's props instead of inline styles (e.g `style={{margin: 3}}` should be `margin="3px"`

2.  `<Text>Look ma, text!</Text>`: Use text components whenever rendering text. It has props for manipulating texts, so again no in-line styles. Use `fontColor="red"`, not `style={{color: 'red'}}`.

3.  Styled-components: See the `ui/button.tsx` file for an example of how to use these.

4.  BassCss: This library gives you access to a bunch of [classes](http://basscss.com/) that apply styles in a browser-compatible way, has affordances for responsiveness and alleviates the need for inline styles or LESS/CSS files.

With the above 4 tools and following the React paradigm, you shouldn't need CSS/LESS files. IF there are special occasions where you do, these is a `all.less` file, but this is a solution of last resort. Use it sparingly.

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Prettier

Run from the monorepo root directory:

```
yarn prettier
```

### Resources

##### Toolkit

*   [Styled Components](https://www.styled-components.com/)
*   [BassCSS](http://basscss.com/)

##### Recommended Atom packages:

*   [atom-typescript](https://atom.io/packages/atom-typescript)
*   [linter-tslint](https://atom.io/packages/linter-tslint)

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.
