import eslint from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import prettier from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  perfectionist.configs['recommended-natural'],
  prettier,
  prettierConfig,
  {
    files: ['**/*.{ts,mts,tsx,.html}'],
    name: 'app/files-to-lint',
  },
  {
    ignores: ['**/dist/**'],
    name: 'app/files-to-ignore',
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],

      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-imports': 'error',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-modules': 'off',

      'prettier/prettier': 'error',
    },
  },
)
