import js from '@eslint/js'
import jestPlugin from 'eslint-plugin-jest'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'

const sharedGlobals = {
    AbortController: 'readonly',
    Buffer: 'readonly',
    CustomEvent: 'readonly',
    Event: 'readonly',
    FormData: 'readonly',
    Headers: 'readonly',
    Request: 'readonly',
    Response: 'readonly',
    TextDecoder: 'readonly',
    TextEncoder: 'readonly',
    URL: 'readonly',
    URLSearchParams: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    clearInterval: 'readonly',
    clearTimeout: 'readonly',
    console: 'readonly',
    document: 'readonly',
    fetch: 'readonly',
    global: 'readonly',
    globalThis: 'readonly',
    location: 'readonly',
    module: 'readonly',
    navigator: 'readonly',
    process: 'readonly',
    require: 'readonly',
    setInterval: 'readonly',
    setTimeout: 'readonly',
    window: 'readonly'
}

const jestGlobals = {
    afterAll: 'readonly',
    afterEach: 'readonly',
    beforeAll: 'readonly',
    beforeEach: 'readonly',
    describe: 'readonly',
    expect: 'readonly',
    it: 'readonly',
    jest: 'readonly',
    test: 'readonly'
}

const commonRules = {
    'no-var': 'error',
    'prefer-const': ['error', { destructuring: 'all' }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'multi-line'],
    'dot-notation': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': ['error', 'always'],
    'no-param-reassign': ['error', { props: false }],
    'no-alert': 'warn',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-continue': 'error',
    'no-else-return': ['error', { allowElseIf: false }],
    'no-lonely-if': 'error',
    'no-mixed-operators': 'error',
    'no-underscore-dangle': ['error', { allow: ['_meta'], allowAfterThis: true }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'prefer-arrow-callback': 'off',
    'no-duplicate-imports': 'error',
    'prefer-template': 'error',
    'object-shorthand': ['error', 'always'],
    'prefer-destructuring': ['error', { array: false, object: true }],
    'func-style': 'off',
    'no-loop-func': 'error',
    'consistent-return': 'error',
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'no-throw-literal': 'error',
    'no-multi-assign': 'error',
    'no-multi-spaces': 'error',
    'no-bitwise': 'error',
    'no-nested-ternary': 'error'
}

const lightweightJsdocRules = {
    'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
    'jsdoc/check-param-names': ['off', { useDefaultObjectProperties: false }],
    'jsdoc/no-undefined-types': 'off',
    'jsdoc/no-defaults': 'off'
}

export default tseslint.config(
    {
        ignores: ['node_modules/**', 'app/**', 'dist/**', 'coverage/**']
    },
    {
        files: ['**/*.{js,cjs,mjs}'],
        extends: [js.configs.recommended],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: sharedGlobals
        },
        plugins: {
            jsdoc: jsdocPlugin
        },
        rules: {
            ...commonRules,
            ...jsdocPlugin.configs['flat/recommended'].rules,
            ...lightweightJsdocRules,
            'no-unused-vars': [
                'error',
                {
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    caughtErrors: 'none',
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            'no-shadow': 'error',
            'no-use-before-define': ['error', { functions: true }],
            'jsdoc/require-jsdoc': [
                'error',
                {
                    publicOnly: false,
                    checkConstructors: false,
                    require: {
                        FunctionDeclaration: true,
                        MethodDefinition: true,
                        ClassDeclaration: true,
                        ArrowFunctionExpression: false,
                        FunctionExpression: false
                    }
                }
            ]
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.eslint.json'],
                tsconfigRootDir: import.meta.dirname
            },
            globals: sharedGlobals
        },
        plugins: {
            jsdoc: jsdocPlugin
        },
        rules: {
            ...commonRules,
            ...lightweightJsdocRules,
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports'
                }
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    caughtErrors: 'none',
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-use-before-define': ['error', { functions: true }]
        }
    },
    {
        files: ['tests/**/*.{ts,tsx,js}'],
        languageOptions: {
            globals: jestGlobals
        },
        plugins: {
            jest: jestPlugin
        },
        rules: {
            ...jestPlugin.configs['flat/recommended'].rules,
            'jsdoc/require-jsdoc': 'off',
            'jest/no-disabled-tests': 'warn',
            'jest/expect-expect': 'off',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/no-conditional-expect': 'error',
            'jest/prefer-to-have-length': 'warn',
            'jest/valid-expect': 'error'
        }
    },
    {
        files: ['src/cli/**/*.ts', 'src/server/serve.ts'],
        rules: {
            'no-console': 'off'
        }
    },
    eslintPluginPrettierRecommended
)
