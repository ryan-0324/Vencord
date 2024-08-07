/*
 * discord-types
 * Copyright (C) 2024 Vencord project contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** @internal */
export type Bivariant<T extends (...args: never[]) => unknown>
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    = { _(...args: Parameters<T>): ReturnType<T>; }["_"];

/** @internal */
export type Defined<T> = Exclude<T, undefined>;

/** @internal */
export type GenericConstructor = new (...args: any[]) => unknown;

/** @internal */
export type IsAny<T> = 0 extends 1 & T ? unknown : never;

/** @internal */
export type Nullish = null | undefined;

/** @internal */
export type OmitOptional<T> = {
    [Key in keyof T as {} extends Record<Key, unknown>
        ? never
        : T extends Record<Key, unknown>
            ? Key
            : never
    ]: T[Key];
};

/** @internal */
export type Optional<T, Value = undefined, Keys extends keyof T = keyof T, ExcludeKeys = false>
    = ExcludeKeys extends true
        ? Pick<T, Keys> & { [Key in Exclude<keyof T, Keys>]?: T[Key] | Value; }
        : Omit<T, Keys> & { [Key in Keys]?: T[Key] | Value; };

/** @internal */
export type OptionalTuple<T extends readonly unknown[], Value = undefined>
    = { [Key in keyof T]?: T[Key] | Value; };

/** @internal */
export type PartialOnUndefined<T> = Partial<T>
    & { [Key in keyof T as undefined extends T[Key] ? never : Key]: T[Key]; };

type StringablePrimitive = string | bigint | number | boolean | Nullish;

/** @internal */
export type Stringable
    = { [Symbol.toPrimitive]: (hint: "default" | "string") => StringablePrimitive; }
    | ({ toString: () => StringablePrimitive; } | { valueOf: () => StringablePrimitive; })
    & { [Symbol.toPrimitive]?: Nullish; };

/** @internal */
export type StringProperties<T> = { [Key in Exclude<keyof T, symbol>]: T[Key]; };

/** @internal */
export type UnionToIntersection<Union> = (
    Union extends unknown
        ? (arg: Union) => unknown
        : never
) extends ((arg: infer Intersection) => unknown)
    ? Intersection
    : never;
