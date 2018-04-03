// blockies declarations
declare interface BlockiesIcon {
    toDataURL(): string;
}
declare interface BlockiesConfig {
    seed: string;
}
declare function blockies(config: BlockiesConfig): BlockiesIcon;
declare module 'blockies' {
    export = blockies;
}
