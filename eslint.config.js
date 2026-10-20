import antfu from '@antfu/eslint-config'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

export default antfu(
  {
    react: true,
    typescript: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    // Markdown 只承载文档与历史方案，代码片段不参与 lint
    markdown: false,
    ignores: [
      'dist',
      'docs/**',
      'supabase/config.toml',
      '.agents/**',
      '.claude/**',
      '.codegraph/**',
      '.codex/**',
      '.cursor/**',
      '.github/skills/**',
      '.opencode/**',
      '.superpowers/**',
      'openspec/**',
      // Supabase CLI 自动生成，禁止手动修改
      'src/services/database.types.ts',
    ],
  },
  {
    rules: {
      // 项目在 Node / Vite / Deno 多环境直接使用全局 process、Buffer
      'node/prefer-global/buffer': 'off',
      'node/prefer-global/process': 'off',
      // jsPDF 官方导出名为小写开头的构造函数
      'new-cap': ['error', { capIsNew: false, newIsCap: true, newIsCapExceptions: ['jsPDF'], properties: true }],
      // 闭包内引用稍后声明的变量（vi.fn 互相引用、定时器与回调互相清理）属于常见写法，TS 已拦截真正的 TDZ 访问
      'ts/no-use-before-define': ['error', { classes: false, functions: false, variables: false }],
    },
  },
  {
    // 这些脚本测试由 `node --test` 运行，不能改成 vitest
    files: ['scripts/**/*.test.mjs', 'aliyun-fc/**/*.test.js'],
    rules: {
      'test/consistent-test-it': 'off',
      'test/no-import-node-test': 'off',
    },
  },
  {
    // Web Worker 中使用 self 是标准写法
    files: ['**/*.worker.{js,ts}'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
  {
    // 服务端与脚本需要输出运行日志
    files: [
      'aliyun-fc/**',
      'api/**',
      'scripts/**',
      'server/**',
      'supabase/functions/**',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // 改写成 Array.from({ length }).fill(x) 后 TS 会推断为 unknown[]
      'e18e/prefer-array-fill': 'off',
      // 保留既有测试标题（含组件名大小写），避免批量改名
      'test/prefer-lowercase-title': 'off',
      'ts/ban-ts-comment': 'off',
      'ts/no-explicit-any': 'off',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'react/set-state-in-effect': 'off',
      // 自动修复会拆分 JSX 文本并丢失空格（如 `{a} / {b}` 渲染成 `a /b`）
      'style/jsx-one-expression-per-line': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/index.css',
      },
    },
    rules: {
      'better-tailwindcss/enforce-consistent-class-order': 'warn',
      'better-tailwindcss/no-duplicate-classes': 'warn',
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
    },
  },
)
