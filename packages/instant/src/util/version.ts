const anyWindow = window as any;

export const versionUtil = {
    writeVersionInfoToWindow: () => {
        anyWindow.__zeroExInstantGitSha = process.env.GIT_SHA;
        anyWindow.__zeroExInstantNpmVersion = process.env.NPM_PACKAGE_VERSION;
    },
};
