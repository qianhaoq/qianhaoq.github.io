export const SITE = {
  title: 'Hao Qian',
  subtitle: 'AI Coding / 工程实践 / 产品思考',
  description: 'Hao Qian 的个人博客，记录 AI Coding、工程系统、产品思考和长期实践笔记。',
  url: 'https://qianhaoq.github.io',
  author: 'Hao Qian',
  github: 'https://github.com/qianhaoq',
  avatar: 'https://avatars.githubusercontent.com/u/12046046?v=4'
} as const;

export const NAV_ITEMS = [
  { href: '/', label: '首页' },
  { href: '/posts/', label: '文章' },
  { href: '/tags/', label: '标签' },
  { href: '/archive/', label: '归档' },
  { href: '/search/', label: '搜索' },
  { href: '/about/', label: '关于' }
] as const;
