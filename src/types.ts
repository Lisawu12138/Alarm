export type Species = 'frog' | 'cat' | 'dog' | 'otter' | 'bear' | 'bunny' | 'bird';
export type ColorName = 'sun' | 'peach' | 'mint' | 'soft' | 'darkMuted' | 'orange';

export interface Profile {
  id: string;
  nickname: string;
  avatar_char: string;
  avatar_color: ColorName;
  timezone: string;
  volume: number;
  challenge_seconds: number;
  allow_live_autoplay: boolean;
  favorite_voice_id: string | null;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  timezone: string;
  food_stock: number;
  created_by: string | null;
}

export interface Pet {
  id: string;
  group_id: string;
  species: Species;
  name: string;
  color: ColorName;
  accessory: string;
  fed_days: number;
  hunger_days: number;
  status: 'active' | 'left';
  adopted_at: string;
  left_at: string | null;
}

export interface AlarmDay {
  user_id: string;
  weekday: number; // 0 = Sunday
  alarm_time: string | null; // "HH:MM:SS"
  enabled: boolean;
}

export interface BoardMember {
  user_id: string;
  nickname: string;
  avatar_char: string;
  avatar_color: ColorName;
  timezone: string;
  scheduled_at: string | null;
  status: 'ringing' | 'done' | 'skipped' | null;
  started_at: string | null;
  completed_at: string | null;
  shake_seconds: number | null;
}

export interface Board {
  group_day: string;
  members: BoardMember[];
  reward_today: boolean;
  fed_today: { user_id: string; fed_at: string } | null;
}

export interface Voice {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  kind: 'morning' | 'favorite' | 'live';
  storage_path: string;
  duration_ms: number | null;
  for_alarm_at: string | null;
  selected: boolean;
  used_at: string | null;
  created_at: string;
}

export interface Feeding {
  id: string;
  user_id: string | null;
  group_day: string;
  fed_at: string;
}

export interface GroupPreview {
  id: string;
  name: string;
  timezone: string;
  members: { nickname: string; avatar_char: string; avatar_color: ColorName }[];
  pet: { name: string; species: Species } | null;
}

export interface FinishResult {
  group_day: string;
  done: number;
  total: number;
  reward_granted: boolean;
  reward_today: boolean;
  food_stock: number;
}
