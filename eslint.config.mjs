import antfu from '@antfu/eslint-config'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    lessOpinionated: true,
    type: 'app',
    typescript: true,
    vue: true,
    test: false,
  },
  {
    ...betterTailwindcss.configs.recommended,
    files: ['**/*.vue'],
    ignores: [
      'src/components/HelloWorld.vue',
      'src/components/TheWelcome.vue',
      'src/components/WelcomeItem.vue',
      'src/components/icons/*.vue',
    ],
    name: 'app/tailwind',
    rules: {
      ...betterTailwindcss.configs.recommended.rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-unknown-classes': ['error', { ignore: ['^safe-bottom$'] }],
    },
    settings: {
      'better-tailwindcss': {
        detectComponentClasses: true,
        entryPoint: 'src/assets/main.css',
      },
    },
  },
)
