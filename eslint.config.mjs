// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

export default tseslint.config(
    // 1) Global ignores
    {
        ignores: [
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/node_modules/**',
        ],
    },

    // 2) Base JS + TS rules
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // 3) React app: apps/web-react
    {
        files: ['apps/web-react/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'react-refresh': reactRefreshPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            // React recommended
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            ...reactRefreshPlugin.configs.recommended.rules,

            // Common tweaks
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
        },
    },

    // 4) TS library packages: packages/*
    {
        files: ['packages/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        rules: {
            // Put Node/lib-specific rules here if you want
        },
    },

    // 5) Config / script files (Node-style)
    {
        files: ['**/*.config.{js,cjs,mjs}', '**/*.config.*.cjs'],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'script',
            },
        },
        // No "env" – flat config doesn’t support it
    }
);
