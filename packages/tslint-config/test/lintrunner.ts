import * as path from 'path';
import { Configuration, Linter, Replacement } from 'tslint';

export const helper = (src: string, rule: string) => {
    const linter = new Linter({ fix: false });
    linter.lint(
        '',
        src,
        Configuration.parseConfigFile({
            rules: {
                [rule]: true,
            },
            rulesDirectory: path.join(__dirname, '../rules'),
        }),
    );
    return linter.getResult();
};

export const getFixedResult = (src: string, rule: string) => {
    const result = helper(src, rule);
    const fixes = [].concat.apply(result.failures.map(x => x.getFix()));
    return Replacement.applyFixes(src, fixes);
};
