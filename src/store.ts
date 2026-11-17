import { createContext, useContext } from 'react';
import type { Api, AppData } from './api';
import type { Board, Profile, Voice } from './types';

export type Route =
  | { name: 'tabs' }
  | { name: 'record'; to: string; kind?: 'morning' | 'favorite' }
  | { name: 'live'; to: string }
  | { name: 'sounds' }
  | { name: 'settings' };

export interface Ctx {
  api: Api;
  uid: string;
  data: AppData;
  board: Board | null;
  voices: Voice[];
  reload: () => Promise<void>;
  reloadBoard: () => Promise<void>;
  reloadVoices: () => Promise<void>;
  toast: (msg: string) => void;
  go: (r: Route) => void;
  back: () => void;
  tab: 'group' | 'alarm' | 'pet';
  setTab: (t: 'group' | 'alarm' | 'pet') => void;
  member: (id: string | null | undefined) => Profile | undefined;
  armed: boolean;
  arm: (on: boolean) => Promise<void>;
  testRing: () => void;
}

export const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);
