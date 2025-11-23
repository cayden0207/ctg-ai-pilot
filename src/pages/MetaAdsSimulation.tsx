import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BASE_PATH = '/meta-ads-simulation/';

export function MetaAdsSimulation() {
  const location = useLocation();
  const navigateRR = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const clickHandlerRef = useRef<(e: MouseEvent) => void>();
  const [currentPage, setCurrentPage] = useState<string>('index.html');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const ensureHeadAssets = useCallback(() => {
    const doc = document;
    if (!doc.getElementById('meta-sim-styles')) {
      const link = doc.createElement('link');
      link.id = 'meta-sim-styles';
      link.rel = 'stylesheet';
      link.href = `${BASE_PATH}styles.css`;
      doc.head.appendChild(link);
    }
    if (!doc.getElementById('meta-sim-leaflet-css')) {
      const link = doc.createElement('link');
      link.id = 'meta-sim-leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      doc.head.appendChild(link);
    }
  }, []);

  const normalizePage = useCallback((path: string) => {
    const cleaned = path.startsWith(BASE_PATH)
      ? path.slice(BASE_PATH.length)
      : path.startsWith('/')
        ? path.slice(path.lastIndexOf('/') + 1)
        : path;
    return cleaned || 'index.html';
  }, []);

  const syncFromLocation = useCallback(() => {
    if (location.pathname.startsWith(BASE_PATH)) {
      const next = normalizePage(location.pathname);
      setCurrentPage(next);
    } else if (location.pathname === '/meta-ads-simulation') {
      setCurrentPage('index.html');
    }
  }, [location.pathname, normalizePage]);

  useEffect(() => {
    syncFromLocation();
  }, [syncFromLocation]);

  const navigate = useCallback((path: string) => {
    const normalized = normalizePage(path);
    setCurrentPage((prev) => {
      if (prev !== normalized) return normalized;
      return prev;
    });
    const targetPath =
      normalized === 'index.html' ? '/meta-ads-simulation' : `/meta-ads-simulation/${normalized}`;
    if (location.pathname !== targetPath) {
      navigateRR(targetPath);
    }
  }, [normalizePage, location.pathname, navigateRR]);

  // Expose global hook for scripts and inline handlers
  useEffect(() => {
    (window as any).__metaSimNavigate = navigate;
  }, [navigate]);

  const rewriteInlineNavigation = useCallback((input: string) => {
    // Convert location.href assignments to our internal navigation helper
    return input.replace(/location\\.href\\s*=\\s*['"]([^'"]+)['"]/g, (_m, p1) => {
      return `window.__metaSimNavigate('${p1}')`;
    });
  }, []);

  const loadPage = useCallback(async (page: string) => {
    ensureHeadAssets();
    setLoading(true);
    setError(null);
    const url = new URL(`${BASE_PATH}${page}`, window.location.origin);
    try {
      const resp = await fetch(url.toString());
      if (!resp.ok) throw new Error(`加载失败：${resp.status}`);
      let html = await resp.text();

      // Quick string-level rewrite for inline handler text
      html = rewriteInlineNavigation(html);

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Collect and remove scripts for controlled execution
      const scriptNodes = Array.from(doc.querySelectorAll('script')).map((script) => {
        const src = script.getAttribute('src');
        const resolvedSrc = src ? new URL(src, url).toString() : null;
        const content = rewriteInlineNavigation(script.textContent || '');
        return { src: resolvedSrc, content };
      });
      doc.querySelectorAll('script').forEach((s) => s.remove());

      // Rewrite inline onclick handlers
      doc.querySelectorAll<HTMLElement>('[onclick]').forEach((el) => {
        const val = el.getAttribute('onclick') || '';
        const rewritten = rewriteInlineNavigation(val);
        el.setAttribute('onclick', rewritten);
      });

      // Inject content into container
      const container = containerRef.current;
      if (!container) return;

      // Clean previous click handler
      if (clickHandlerRef.current) {
        container.removeEventListener('click', clickHandlerRef.current);
      }

      container.innerHTML = '';
      Array.from(doc.body.childNodes).forEach((node) => {
        container.appendChild(document.importNode(node, true));
      });

      // Intercept anchor navigation for .html targets
      const clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        const anchor = target?.closest('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href && href.endsWith('.html')) {
            e.preventDefault();
            navigate(href);
            return;
          }
          if (href && href.startsWith(BASE_PATH) && href.endsWith('.html')) {
            e.preventDefault();
            navigate(href);
            return;
          }
        }
      };
      clickHandlerRef.current = clickHandler;
      container.addEventListener('click', clickHandler);

      // Execute scripts in order
      for (const info of scriptNodes) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          if (info.src) {
            s.src = info.src;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`脚本加载失败: ${info.src}`));
          } else {
            s.textContent = info.content;
            resolve();
          }
          container.appendChild(s);
        });
      }

      // Patch Sim.goto to stay in-app
      if ((window as any).Sim && typeof (window as any).Sim.goto === 'function') {
        (window as any).Sim.goto = (path: string) => {
          navigate(path);
        };
      }

      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '加载出错');
      setLoading(false);
    }
  }, [ensureHeadAssets, navigate, rewriteInlineNavigation]);

  useEffect(() => {
    loadPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const statusText = useMemo(() => {
    if (error) return error;
    if (loading) return '正在加载 Meta Ads 模拟器...';
    return '';
  }, [loading, error]);

  return (
    <div className="relative">
      {(loading || error) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}
            <span>{statusText}</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto min-h-[80vh]"
      />
    </div>
  );
}
