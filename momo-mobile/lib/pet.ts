import type { State } from './model';

export const petStates = ['awake', 'sleep', 'shake', 'happy', 'fed'] as const;
export type PetState = (typeof petStates)[number];

type AnimationSlot = {
  label: string;
  placeholderPose: PetState;
  asset: string | null;
};

export const petAnimations: Record<PetState, AnimationSlot> = {
  awake: { label: '清醒', placeholderPose: 'awake', asset: null },
  sleep: { label: '睡觉', placeholderPose: 'sleep', asset: null },
  shake: { label: '摇动', placeholderPose: 'shake', asset: null },
  happy: { label: '开心', placeholderPose: 'happy', asset: null },
  fed: { label: '吃饱', placeholderPose: 'fed', asset: null },
};

export function getPetState(state: State): PetState {
  if (state.petOverride) return state.petOverride;
  if (state.active) {
    if (state.progress >= state.settings.duration * 0.66) return 'happy';
    return state.progress > 0 ? 'awake' : 'sleep';
  }
  if (state.fed) return 'fed';
  return state.status === 'completed' ? 'happy' : 'awake';
}
