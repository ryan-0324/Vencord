/*
 * discord-types
 * Copyright (C) 2024 Vencord project contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type MessageFormat from "intl-messageformat";
import type { ReactElement, ReactNode } from "react";
import type { State } from "simple-markdown";

import type { IsAny, OmitOptional, Stringable, UnionToIntersection } from "../../internal";

export declare class FormattedMessage<
    Args extends GenericArgs = never,
    Markdown extends boolean | undefined = boolean
> {
    /**
     * @throws {SyntaxError} Argument `message` must be syntactically valid.
     * @see {@link https://formatjs.io/docs/core-concepts/icu-syntax/}
     * @throws {RangeError} Locale identifiers provided to argument `locales` must be structurally valid.
     * @see {@link https://tc39.es/ecma402/#sec-isstructurallyvalidlanguagetag}
     */
    constructor(
        message: string,
        locales?: string | readonly string[] | undefined /* = MessageFormat.defaultLocale */,
        hasMarkdown?: Markdown
    );

    /**
     * @throws {RangeError | TypeError}
     * @see {@link format}
     */
    astFormat(...args: FormatArgs<Args>): ASTNode;
    /**
     * @throws {RangeError} Values provided to arguments with type date or time must be valid time values.
     * @throws {TypeError} Values provided to arguments with type plural, select, or selectordinal must match one of their matches.
     */
    format(...args: FormatArgs<Args>): Markdown extends true
        ? (string | ReactElement)[]
        : string;
    getContext(values: ContextValues<Args>): [
        { [Key in keyof typeof values]: typeof values[Key] | number; },
        Record<number, typeof values[keyof typeof values]>
    ];
    /**
     * @throws {RangeError | TypeError}
     * @see {@link format}
     */
    plainFormat(...args: FormatArgs<Args>): string;

    hasMarkdown: Markdown;
    intlMessage: MessageFormat;
    message: string;
}

type GenericArgs = RecordArgs | TupleArgs | string;
type RecordArgs = Record<string, GenericValue>;
type TupleArgs = readonly [stringableArgs: string, hookArgs: string];

type GenericValue = Stringable | HookValue;
type HookValue = (result: ReactNode, key: State["key"]) => ReactNode;

type FormatArgs<Args extends GenericArgs>
    = unknown extends IsAny<Args>
        ? [values?: RecordArgs]
        : [Args] extends [never]
            ? []
            : keyof FormatValues<Args> extends never
                ? []
                : [values: FormatValues<Args>];

type FormatValues<Args extends GenericArgs> = UnionToIntersection<MessageValues<Args>>;

type ContextValues<Args extends GenericArgs>
    = unknown extends IsAny<Args>
        ? RecordArgs
        : [Args] extends [never]
            ? {}
            : MessageValues<Args>;

type MessageValues<Args extends GenericArgs>
    = Args extends string
        ? Record<string extends Args ? never : Args, Stringable>
        : Args extends readonly [string, string]
            ? Record<Args[0], Stringable> & Record<Args[1], HookValue>
            : OmitOptional<Args>;

/** @todo Add types for every type of ASTNode. */
export interface ASTNode<Type extends ASTNodeType = ASTNodeType> extends Record<string, any> {
    type: Type;
}

// Original name: AST_KEY
/** @todo There may be more undocumented types. */
export enum ASTNodeType {
    ATTACHMENT_LINK = "attachmentLink",
    AUTOLINK = "autolink",
    BLOCK_QUOTE = "blockQuote",
    LINE_BREAK = "br",
    CHANNEL = "channel",
    CHANNEL_MENTION = "channelMention",
    CODE_BLOCK = "codeBlock",
    COMMAND_MENTION = "commandMention",
    CUSTOM_EMOJI = "customEmoji",
    ITALICS = "em",
    EMOJI = "emoji",
    ESCAPE = "escape",
    GUILD = "guild",
    HEADING = "heading",
    HIGHLIGHT = "highlight",
    HOOK = "hook", // Undocumented
    IMAGE = "image",
    INLINE_CODE = "inlineCode",
    LINK = "link",
    LIST = "list",
    MENTION = "mention",
    NEWLINE = "newline",
    PARAGRAPH = "paragraph",
    ROLE_MENTION = "roleMention",
    STRIKETHROUGH = "s",
    SOUNDBOARD = "soundboard",
    SPOILER = "spoiler",
    STATIC_ROUTE_LINK = "staticRouteLink",
    STRONG = "strong",
    SUBTEXT = "subtext",
    TEXT = "text",
    TIMESTAMP = "timestamp",
    UNDERLINE = "u",
    URL = "url",
}
