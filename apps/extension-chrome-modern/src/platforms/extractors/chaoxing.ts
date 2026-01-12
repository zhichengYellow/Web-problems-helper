import type { PlatformExtractor } from '../types'
import { createGenericExtractor } from './generic'

// 学习通/超星：页面形态很多，这里只做“用户当前页面可见题面”的保守抽取
export const chaoxingExtractor: PlatformExtractor = createGenericExtractor(
  'chaoxing',
  (loc) => /(^|\.)chaoxing\.com$/i.test(loc.hostname),
  [
    '.option',
    'label',
    '.answerOption',
    '.TiMu .clearfix label'
  ]
)
