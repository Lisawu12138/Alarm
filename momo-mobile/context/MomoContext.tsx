import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialState, reducer, restore, STORAGE_KEY, type Action, type State } from '@/lib/model';
import { translate } from '@/lib/i18n';

type Ctx = {
  state: State;
  dispatch: (a: Action) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  hydrated: boolean;
  storageNotice: string | null;
  dismissNotice: () => void;
  name: string;
};
const MomoContext = createContext<Ctx | null>(null);

export function MomoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [storageNotice, setNotice] = useState<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!alive) return;
        if (raw) {
          const restored = restore(raw);
          if (restored) dispatch({ type: 'HYDRATE', state: restored });
          else setNotice('本地记录无法读取，已恢复初始状态。');
        }
      })
      .catch(() => alive && setNotice('本地存储不可用；本次可体验，重启后不保留。'))
      .finally(() => alive && setHydrated(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Serialized write queue; each write reads the latest state at execution time.
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current)))
      .catch(() => setNotice('本地存储不可用；本次可体验，重启后不保留。'));
  }, [state, hydrated]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(state.language, key, params),
    [state.language],
  );
  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo(
    () => ({ state, dispatch, t, hydrated, storageNotice, dismissNotice, name: state.profile.nickname }),
    [state, t, hydrated, storageNotice, dismissNotice],
  );
  return <MomoContext.Provider value={value}>{children}</MomoContext.Provider>;
}

export function useMomo() {
  const c = useContext(MomoContext);
  if (!c) throw new Error('useMomo must be used within MomoProvider');
  return c;
}
