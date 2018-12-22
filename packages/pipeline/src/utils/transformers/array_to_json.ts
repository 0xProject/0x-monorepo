import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer';

// Use when saving arrays as jsonb column type. node-postgres automatically converts
// arrays `[x, y, z]` to Postgres arrays `{x, y, z}` causing JSON validation errors.
// This workaround preserves the array as-is. See https://github.com/typeorm/typeorm/issues/183
// and https://github.com/brianc/node-postgres/issues/442 for more information.
export class ArrayToJsonTransformer implements ValueTransformer {
    // tslint:disable-next-line:prefer-function-over-method
    public to(value: any[]): string | null {
        if (value === null) {
            return null;
        } else {
            return JSON.stringify(value);
        }
    }
    // tslint:disable-next-line:prefer-function-over-method
    public from(value: string): any[] | null {
        return JSON.parse(value);
    }
}
export const arrayToJsonTransformer = new ArrayToJsonTransformer();
