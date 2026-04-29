type PerfStore = {
  counters: Record<string, number>;
  marks: Array<Record<string, any>>;
  requestBuckets: Record<string, number[]>;
  reconnectAttempts: number[];
};

const getStore = (): PerfStore => {
  if (typeof window === 'undefined') {
    return { counters: {}, marks: [], requestBuckets: {}, reconnectAttempts: [] };
  }
  const w = window as any;
  if (!w.__creasalesPerf) {
    w.__creasalesPerf = { counters: {}, marks: [], requestBuckets: {}, reconnectAttempts: [] };
  }
  return w.__creasalesPerf as PerfStore;
};

let metricsIntervalStarted = false;
const METRICS_WINDOW_MS = 60_000;

const ensureMetricsInterval = () => {
  if (typeof window === 'undefined') return;
  if (metricsIntervalStarted) return;
  metricsIntervalStarted = true;
  window.setInterval(() => {
    const store = getStore();
    const now = Date.now();
    Object.keys(store.requestBuckets).forEach((endpoint) => {
      const recent = (store.requestBuckets[endpoint] || []).filter((ts) => now - ts <= METRICS_WINDOW_MS);
      store.requestBuckets[endpoint] = recent;
      if (perfEnabled()) {
        console.log('[perf.front]', { event: 'api.requests_per_min', endpoint, rpm: recent.length });
      }
    });
    const reconnectRecent = (store.reconnectAttempts || []).filter((ts) => now - ts <= 15_000);
    store.reconnectAttempts = reconnectRecent;
    if (perfEnabled() && reconnectRecent.length > 0) {
      console.log('[perf.front]', { event: 'socket.reconnect_burst_15s', attempts: reconnectRecent.length });
    }
  }, 15_000);
};

export const perfEnabled = () =>
  typeof window !== 'undefined' && window.localStorage?.getItem('perfLogs') === '1';

export const perfCounter = (name: string, inc: number = 1) => {
  if (typeof window === 'undefined') return;
  const store = getStore();
  store.counters[name] = (store.counters[name] || 0) + inc;
};

export const perfTrackRequest = (endpoint: string) => {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const store = getStore();
  if (!store.requestBuckets[endpoint]) {
    store.requestBuckets[endpoint] = [];
  }
  store.requestBuckets[endpoint].push(now);
  if (store.requestBuckets[endpoint].length > 2000) {
    store.requestBuckets[endpoint] = store.requestBuckets[endpoint].slice(-2000);
  }
  ensureMetricsInterval();
};

export const perfTrackReconnectAttempt = (source: string) => {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const store = getStore();
  store.reconnectAttempts.push(now);
  if (store.reconnectAttempts.length > 1000) {
    store.reconnectAttempts = store.reconnectAttempts.slice(-1000);
  }
  perfMark('socket.reconnect_attempt', { source });
  ensureMetricsInterval();
};

export const perfTrackMemory = (context: string, payload?: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  const mem = (performance as any)?.memory;
  perfLog('ui.memory', {
    context,
    usedJSHeapSize: mem?.usedJSHeapSize ?? null,
    totalJSHeapSize: mem?.totalJSHeapSize ?? null,
    jsHeapSizeLimit: mem?.jsHeapSizeLimit ?? null,
    ...(payload || {}),
  });
};

export const perfMark = (event: string, payload?: Record<string, any>) => {
  const ts = Date.now();
  const mark = { event, ts, ...payload };
  const store = getStore();
  store.marks.push(mark);
  if (store.marks.length > 800) {
    store.marks.splice(0, store.marks.length - 800);
  }
  if (perfEnabled()) {
    console.log('[perf.front]', mark);
  }
};

export const perfLog = (event: string, payload: Record<string, any>) => {
  if (!perfEnabled()) return;
  console.log('[perf.front]', { event, ...payload });
};

export const perfSnapshot = () => {
  const store = getStore();
  return {
    counters: { ...store.counters },
    marks: [...store.marks],
  };
};

export const perfReset = () => {
  if (typeof window === 'undefined') return;
  const w = window as any;
  w.__creasalesPerf = { counters: {}, marks: [], requestBuckets: {}, reconnectAttempts: [] };
};

if (typeof window !== 'undefined') {
  const w = window as any;
  if (!w.__creasalesPerfSnapshot) {
    w.__creasalesPerfSnapshot = perfSnapshot;
  }
  if (!w.__creasalesPerfReset) {
    w.__creasalesPerfReset = perfReset;
  }
}
