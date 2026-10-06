export interface SearchEngine {
  id: string
  name: string
  url: string
  color: string
}

export const ENGINES: SearchEngine[] = [
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=%s', color: '#2932e1' },
  { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=%s', color: '#008373' },
  { id: 'google', name: '谷歌', url: 'https://www.google.com/search?q=%s', color: '#4285f4' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query=%s', color: '#fd6b1b' },
  { id: 'so360', name: '360', url: 'https://www.so.com/s?q=%s', color: '#19b955' },
  { id: 'zhihu', name: '知乎', url: 'https://www.zhihu.com/search?type=content&q=%s', color: '#0084ff' },
  { id: 'bilibili', name: '哔哩哔哩', url: 'https://search.bilibili.com/all?keyword=%s', color: '#fb7299' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=%s', color: '#24292f' },
  { id: 'taobao', name: '淘宝', url: 'https://s.taobao.com/search?q=%s', color: '#ff5000' },
  { id: 'douban', name: '豆瓣', url: 'https://www.douban.com/search?q=%s', color: '#2e963d' },
]

export function engineById(id: string): SearchEngine {
  return ENGINES.find((engine) => engine.id === id) ?? ENGINES[0]
}

export function runSearch(engine: SearchEngine, keyword: string): void {
  const word = keyword.trim()
  if (!word) return
  window.open(engine.url.replace('%s', encodeURIComponent(word)), '_blank', 'noopener,noreferrer')
}
