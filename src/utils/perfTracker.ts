type PerfStore = {
  counters: Record<string, number>;
  marks: Array<Record<string, any>>;
};

const getStore = (): PerfStore => {
  if (typeof window === 'undefined') {
    return { counters: {}, marks: [] };
  }
  const w = window as any;
  if (!w.__creasalesPerf) {
    w.__creasalesPerf = { counters: {}, marks: [] };
  }
  return w.__creasalesPerf as PerfStore;
};

export const perfEnabled = () =>
  typeof window !== 'undefined' && window.localStorage?.getItem('perfLogs') === '1';

export const perfCounter = (name: string, inc: number = 1) => {
  if (typeof window === 'undefined') return;
  const store = getStore();
  store.counters[name] = (store.counters[name] || 0) + inc;
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
  w.__creasalesPerf = { counters: {}, marks: [] };
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
