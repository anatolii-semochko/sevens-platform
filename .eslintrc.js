module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        // No semicolons - project style
        'semi': ['error', 'never'],
        
        // Consistent indentation
        'indent': ['error', 4],
        
        // Consistent quotes
        'quotes': ['error', 'single'],
        
        // No trailing spaces
        'no-trailing-spaces': 'error',
        
        // Consistent comma usage
        'comma-dangle': ['error', 'never'],
        
        // No unused variables
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        
        // Consistent spacing
        'space-before-blocks': 'error',
        'keyword-spacing': 'error',
        'space-infix-ops': 'error',
        
        // Object and array formatting
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        
        // Consistent line breaks
        'eol-last': 'error'
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
}