export type JsonFileType<T extends string> =
  T extends `${infer _}.${infer Ext}` ?
    Ext extends "json" ?
      T
    : never
  : never;
