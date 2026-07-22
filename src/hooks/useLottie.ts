import { useEffect, useState } from "react";

const cache: Record<string, object> = {};
const pending: Record<string, Promise<object>> = {};

export function useLottie(url: string) {
  const [data, setData] = useState<object | null>(cache[url] ?? null);

  useEffect(() => {
    if (cache[url]) { setData(cache[url]); return; }

    if (!pending[url]) {
      pending[url] = fetch(url)
        .then((r) => r.json())
        .then((d) => { cache[url] = d; return d; })
        .catch(() => ({}));
    }

    pending[url].then((d) => setData(d)).catch(() => {});
  }, [url]);

  return data;
}
