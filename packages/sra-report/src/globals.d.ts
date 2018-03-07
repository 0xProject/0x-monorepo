declare module 'newman' {
    export function run(options: any, callback?: () => void): void;
}

declare module '*.json' {
    const value: any;
    export default value;
}
