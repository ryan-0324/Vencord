import stylistic from "@stylistic/eslint-plugin";
import checkFile from "eslint-plugin-check-file";
import eslintPluginHeaders from "eslint-plugin-headers";
import eslintPluginImport from "eslint-plugin-import-x";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        files: ["**/*.?(c|m)[jt]s?(x)"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: ["./tsconfig.eslint.json", "./tsconfig.json"],
                tsconfigRootDir: import.meta.dirname,
                warnOnUnsupportedTypeScriptVersion: false
            }
        },
        plugins: {
            "@stylistic": stylistic,
            "@typescript-eslint": tseslint.plugin,
            "check-file": checkFile,
            headers: eslintPluginHeaders,
            import: eslintPluginImport,
            "simple-import-sort": simpleImportSort,
            unicorn: eslintPluginUnicorn,
            "unused-imports": unusedImports,
        },
        rules: {
            "@stylistic/array-bracket-newline": ["error", "consistent"],
            "@stylistic/array-bracket-spacing": "error",
            "@stylistic/array-element-newline": ["error", "consistent"],
            "@stylistic/arrow-parens": ["error", "as-needed"],
            "@stylistic/block-spacing": "error",
            "@stylistic/brace-style": "error",
            "@stylistic/comma-dangle": ["error", "only-multiline"],
            "@stylistic/comma-spacing": "error",
            "@stylistic/comma-style": "error",
            "@stylistic/computed-property-spacing": "error",
            "@stylistic/dot-location": ["error", "property"],
            "@stylistic/eol-last": "error",
            "@stylistic/function-call-argument-newline": ["error", "consistent"],
            "@stylistic/function-call-spacing": "error",
            "@stylistic/function-paren-newline": ["error", "consistent"],
            "@stylistic/indent": "error",
            "@stylistic/key-spacing": "error",
            "@stylistic/keyword-spacing": "error",
            "@stylistic/linebreak-style": "error",
            "@stylistic/member-delimiter-style": ["error", { singleline: { requireLast: true } }],
            "@stylistic/new-parens": "error",
            "@stylistic/no-extra-semi": "error",
            "@stylistic/no-floating-decimal": "error",
            "@stylistic/no-multi-spaces": "error",
            "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/no-whitespace-before-property": "error",
            "@stylistic/object-curly-newline": "error",
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/rest-spread-spacing": "error",
            "@stylistic/quote-props": ["error", "as-needed"],
            "@stylistic/quotes": "error",
            "@stylistic/semi": "error",
            "@stylistic/semi-spacing": "error",
            "@stylistic/semi-style": "error",
            "@stylistic/space-before-blocks": "error",
            "@stylistic/space-before-function-paren": ["error", { named: "never" }],
            "@stylistic/space-in-parens": "error",
            "@stylistic/space-infix-ops": "error",
            "@stylistic/space-unary-ops": "error",
            "@stylistic/spaced-comment": "error",
            "@stylistic/switch-colon-spacing": "error",
            "@stylistic/template-curly-spacing": "error",
            "@stylistic/template-tag-spacing": "error",
            "@stylistic/type-annotation-spacing": "error",
            "@stylistic/type-generic-spacing": "error",
            "@stylistic/type-named-tuple-spacing": "error",
            "@typescript-eslint/adjacent-overload-signatures": "error",
            "@typescript-eslint/array-type": "error",
            "@typescript-eslint/ban-ts-comment": "error",
            "@typescript-eslint/ban-types": "error",
            "@typescript-eslint/class-literal-property-style": "error",
            "@typescript-eslint/consistent-type-definitions": "error",
            "@typescript-eslint/consistent-type-exports": ["error", { fixMixedExportsWithInlineTypeSpecifier: true }],
            "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
            "@typescript-eslint/member-ordering": ["error", {
                default: {
                    memberTypes: [
                        "call-signature",
                        "signature",
                        "constructor",
                        ["static-accessor", "static-field", "static-get", "static-method", "static-set"],
                        ["accessor", "get", "method", "set"],
                        "field"
                    ],
                    order: "alphabetically-case-insensitive"
                }
            }],
            "@typescript-eslint/method-signature-style": "error",
            "@typescript-eslint/naming-convention": ["error", {
                selector: "typeLike",
                format: ["PascalCase"]
            }],
            "@typescript-eslint/no-duplicate-enum-values": "error",
            "@typescript-eslint/no-duplicate-type-constituents": "error",
            "@typescript-eslint/no-empty-interface": "error",
            "@typescript-eslint/no-import-type-side-effects": "error",
            "@typescript-eslint/no-invalid-void-type": "error",
            "@typescript-eslint/no-misused-new": "error",
            "@typescript-eslint/no-redundant-type-constituents": "error",
            "@typescript-eslint/no-require-imports": "error",
            "@typescript-eslint/no-unnecessary-qualifier": "error",
            "@typescript-eslint/no-unnecessary-type-arguments": "error",
            "@typescript-eslint/no-unnecessary-type-constraint": "error",
            "@typescript-eslint/no-unsafe-declaration-merging": "error",
            "@typescript-eslint/no-useless-empty-export": "error",
            "@typescript-eslint/prefer-function-type": "error",
            "@typescript-eslint/triple-slash-reference": "error",
            "@typescript-eslint/unified-signatures": ["error", { ignoreDifferentlyNamedParameters: true }],
            "check-file/filename-naming-convention": ["error", { "**/*.{mjs,ts}": "+([.0-9A-Za-z])" }],
            "check-file/folder-naming-convention": ["error", { "**/": "CAMEL_CASE" }],
            "import/extensions": "error",
            "import/first": "error",
            "import/newline-after-import": ["error", { considerComments: true }],
            "import/no-absolute-path": "error",
            "import/no-duplicates": "error",
            "import/no-empty-named-blocks": "error",
            "import/no-extraneous-dependencies": ["error", { includeTypes: true }],
            "import/no-relative-packages": "error",
            "import/no-self-import": "error",
            "import/no-unassigned-import": "error",
            "import/no-useless-path-segments": "error",
            "simple-import-sort/exports": "error",
            "simple-import-sort/imports": ["error", { groups: [["^[^.]"]] }],
            "unicorn/escape-case": "error",
            "unicorn/no-hex-escape": "error",
            "unicorn/no-zero-fractions": "error",
            "unicorn/number-literal-case": "error",
            "unicorn/numeric-separators-style": ["error", { number: { minimumDigits: 0 } }],
            "unicorn/prefer-export-from": ["error", { ignoreUsedVariables: true }],
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_",
                destructuredArrayIgnorePattern: "^_",
                varsIgnorePattern: "^_"
            }],
        }
    },
    {
        files: ["src/**/*"],
        rules: {
            "@typescript-eslint/prefer-enum-initializers": "error",
            // Disallow .d.ts files so that package consumers can use exported enums
            "check-file/filename-blocklist": ["error", { "!**/!(*.d).ts": "!(*.d).ts" }],
            "headers/header-format": ["error", {
                source: "string",
                content: [
                    "discord-types",
                    "Copyright (C) {year} {author}",
                    "SPDX-License-Identifier: GPL-3.0-or-later"
                ].join("\n"),
                blockPrefix: "\n",
                trailingNewlines: 2,
                variables: {
                    year: "2024",
                    author: "Vencord project contributors"
                }
            }],
            "import/no-default-export": "error",
            "import/no-extraneous-dependencies": ["error", {
                devDependencies: false,
                includeTypes: true
            }],
            "import/no-unassigned-import": "error",
            "no-restricted-globals": ["error", "_", "IntlMessageFormat", "JSX", "React", "SimpleMarkdown"],
            "no-restricted-syntax": [
                "error",
                `:expression:not(${[
                    // Allow ambient classes
                    "[declare=true] *",
                    // Allow enums, interfaces, and type aliases
                    "[type=/^TS/] *",
                    // Allow re-exporting of all named exports
                    "ExportAllDeclaration *",
                    // Allow imports
                    "ImportDeclaration *",
                ].join(", ")})`,
                // Prefer naming function parameters instead of destructuring them
                ":matches(ArrayPattern, ObjectPattern).params",
                // Disallow enums that are const or ambient since package consumers cannot use them
                "TSEnumDeclaration:matches([const=true], [declare=true])",
            ],
        }
    },
    {
        // https://github.com/import-js/eslint-plugin-import/issues/2414
        files: ["src/**/!(index.ts)"],
        rules: {
            "import/no-unused-modules": ["error", { missingExports: true }],
        }
    },
);
