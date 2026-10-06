import { DATA_VERSION, DEFAULT_SETTINGS } from './storage'
import type { NavData, NavItem, NavPage } from '../types'

const now = Date.now()

function seed(name: string, url: string, color: string, detail?: string): NavItem {
  return { id: `seed-${name}`, type: 'bookmark', name, url, color, detail, createdAt: now, updatedAt: now }
}

const groups: Array<{ page: NavPage; items: NavItem[] }> = [
  {
    page: { id: 'page-daily', name: '常用', icon: 'star' },
    items: [
      seed('百度', 'https://www.baidu.com', '#2932e1'),
      seed('哔哩哔哩', 'https://www.bilibili.com', '#fb7299'),
      seed('知乎', 'https://www.zhihu.com', '#0084ff'),
      seed('微博', 'https://weibo.com', '#e6162d'),
      seed('淘宝', 'https://www.taobao.com', '#ff5000'),
      seed('京东', 'https://www.jd.com', '#e1251b'),
      seed('小红书', 'https://www.xiaohongshu.com', '#ff2442'),
      seed('豆瓣', 'https://www.douban.com', '#2e963d'),
    ],
  },
  {
    page: { id: 'page-dev', name: '开发', icon: 'code' },
    items: [
      seed('GitHub', 'https://github.com', '#24292f'),
      seed('Stack Overflow', 'https://stackoverflow.com', '#f48024'),
      seed('MDN', 'https://developer.mozilla.org/zh-CN/', '#1b1b1f'),
      seed('npm', 'https://www.npmjs.com', '#cb3837'),
      seed('掘金', 'https://juejin.cn', '#1e80ff'),
      seed('CSDN', 'https://www.csdn.net', '#fc5531'),
      seed('菜鸟教程', 'https://www.runoob.com', '#4caf50'),
      seed('Vercel', 'https://vercel.com', '#111111'),
      seed('阿里云', 'https://www.aliyun.com', '#ff6a00'),
      seed('腾讯云', 'https://cloud.tencent.com', '#00a4ff'),
    ],
  },
  {
    page: { id: 'page-ai', name: 'AI', icon: 'sparkles' },
    items: [
      seed('ChatGPT', 'https://chat.openai.com', '#10a37f'),
      seed('Claude', 'https://claude.ai', '#d97757'),
      seed('DeepSeek', 'https://chat.deepseek.com', '#4d6bfe'),
      seed('通义千问', 'https://tongyi.aliyun.com', '#615ced'),
      seed('Kimi', 'https://kimi.moonshot.cn', '#1f1f1f'),
      seed('文心一言', 'https://yiyan.baidu.com', '#2932e1'),
      seed('豆包', 'https://www.doubao.com', '#3b7cff'),
      seed('智谱清言', 'https://chatglm.cn', '#3859ff'),
    ],
  },
  {
    page: { id: 'page-design', name: '设计', icon: 'palette' },
    items: [
      seed('Figma', 'https://www.figma.com', '#f24e1e'),
      seed('站酷', 'https://www.zcool.com.cn', '#ff5500'),
      seed('花瓣', 'https://huaban.com', '#ff4e50'),
      seed('稿定设计', 'https://www.gaoding.com', '#4a90e2'),
      seed('Iconify', 'https://icon-sets.iconify.design', '#1769aa'),
      seed('Unsplash', 'https://unsplash.com', '#111111'),
      seed('千图网', 'https://www.58pic.com', '#ee2c2c'),
    ],
  },
  {
    page: { id: 'page-media', name: '影音', icon: 'clapperboard' },
    items: [
      seed('腾讯视频', 'https://v.qq.com', '#ff6a00'),
      seed('爱奇艺', 'https://www.iqiyi.com', '#00cc4c'),
      seed('优酷', 'https://www.youku.com', '#1fb8ff'),
      seed('YouTube', 'https://www.youtube.com', '#ff0000'),
      seed('网易云音乐', 'https://music.163.com', '#d81e06'),
      seed('QQ音乐', 'https://y.qq.com', '#31c27c'),
    ],
  },
  {
    page: { id: 'page-tools', name: '工具', icon: 'wrench' },
    items: [
      seed('语雀', 'https://www.yuque.com', '#25b864'),
      seed('有道云笔记', 'https://note.youdao.com', '#2f8ae0'),
      seed('石墨文档', 'https://shimo.im', '#2b2b2b'),
      seed('百度网盘', 'https://pan.baidu.com', '#2f80ff'),
      seed('阿里云盘', 'https://www.alipan.com', '#5b54f0'),
      seed('草料二维码', 'https://cli.im', '#1a73e8'),
      seed('墨刀', 'https://modao.cc', '#5b5bd6'),
      seed('讯飞听见', 'https://www.iflyrec.com', '#1f7cf5'),
    ],
  },
]

export function createDefaultData(): NavData {
  const pages: NavPage[] = []
  const items: NavData['items'] = {}
  for (const group of groups) {
    pages.push(group.page)
    items[group.page.id] = group.items
  }
  return { version: DATA_VERSION, pages, items, settings: { ...DEFAULT_SETTINGS }, updatedAt: Date.now() }
}

export function createEmptyData(): NavData {
  return { version: DATA_VERSION, pages: [], items: {}, settings: { ...DEFAULT_SETTINGS }, updatedAt: 0 }
}
