import { useState, useCallback } from 'react';
import { Keyword, KeywordType } from '../types';
import { generateKeywords } from '../utils/openaiAPI';
import { createKeyword } from '../utils/mockLLM';

export function useKeywordGrid(type: KeywordType) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewKeywords = useCallback(async (domainInput: string) => {
    if (!domainInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const lockedKeywords = keywords
        .filter(k => k.isLocked)
        .map(k => k.value);

      const newKeywordValues = await generateKeywords(type, domainInput, lockedKeywords);
      
      const newKeywords = newKeywordValues.map(value => {
        const existingKeyword = keywords.find(k => k.value === value);
        return existingKeyword || createKeyword(value);
      });

      setKeywords(newKeywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成关键词时发生错误');
    } finally {
      setIsLoading(false);
    }
  }, [type, keywords]);

  const toggleKeyword = useCallback((keyword: Keyword, mode: 'select' | 'lock') => {
    setKeywords(prev => prev.map(k => {
      if (k.id === keyword.id) {
        if (mode === 'select') {
          return { ...k, isSelected: !k.isSelected };
        } else {
          return { ...k, isLocked: !k.isLocked };
        }
      }
      return k;
    }));
  }, []);

  const getSelectedKeywords = useCallback(() => {
    return keywords.filter(k => k.isSelected);
  }, [keywords]);

  const resetKeywords = useCallback(() => {
    setKeywords([]);
    setError(null);
  }, []);

  return {
    keywords,
    isLoading,
    error,
    generateNewKeywords,
    toggleKeyword,
    getSelectedKeywords,
    resetKeywords
  };
} 