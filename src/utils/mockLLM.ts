import { Keyword } from '../types';

// 重新導出 OpenAI API 函數
export { generateKeywords, generateTopics } from './openaiAPI';

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 创建关键词对象
export function createKeyword(value: string, isLocked = false, isSelected = false): Keyword {
  return {
    id: generateId(),
    value,
    isLocked,
    isSelected
  };
} 