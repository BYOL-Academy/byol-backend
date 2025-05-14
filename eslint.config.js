import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import importPlugin from 'eslint-plugin-import'
export default [
  { ignores: ['/frontend/vite.config.js', '**/**/public', '**/frontend/*'] },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
    },
    // Add your rules here
    rules: {
      'import/extensions': ['error', 'always'],
      'unused-imports/no-unused-imports': 'error',
    },
  },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
]
