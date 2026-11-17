# Project Alarm · 网页版

和朋友一起早起、一起养一只小伙伴。v0.1 网页版（PWA），后端用 Supabase。

## 本地运行
```bash
npm install
npm run dev          # http://localhost:5173
# 不连后端看界面：http://localhost:5173/?demo  （?demo=fresh 从注册开始）
```

## 部署（Vercel）
1. 在 Vercel 里 Import 这个 GitHub 仓库，Framework 选 Vite（会自动识别）。
2. 不用配环境变量：Supabase 地址和 publishable key（本来就是公开的）已经写在 `src/api.ts` 里；想换项目就设 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`。
3. 部署完把网址发给朋友。手机上用浏览器打开 →「添加到主屏幕」，体验更像 App。

## 后端（Supabase 项目 `project-alarm`，ref `gvpszthflcuukekrkkrj`）
迁移已经在线上执行：
- `20261117192006_core_schema` 表、RLS、realtime
- `20261117192040_rpc_functions` 建组/入组/领养/起床/喂养/看板/22:00 结算（pg_cron 每 5 分钟检查）、语音存储桶
- `20261117192053_tighten_function_grants`、`20261117193347_column_level_update_grants` 权限收紧
- `20261117193406_nicer_default_avatar`

需要的话可以用 `supabase db pull` 把线上 schema 拉回本地。

## 规则（和代码对应）
- 结算：每晚 22:00（小组时区）。窗口是「前一天 22:00 → 当天 22:00」，成员闹钟响在窗口内就算进当天（`group_day_of` = 小组时区时间 + 2 小时取日期）。
- 奖励：当天参与的人全部完成 → 立刻 +1 份共享食物，每组每天最多一份。休息/没闹钟不计入，跳过算未完成。
- 喂养：每天喂一次，任何成员都可以；喂了 hunger 清零、成长 +1 天。成长：0–4 天幼年，5–13 天成长期，14 天起成年。
- 饥饿：22:00 结算时当天没喂 → 饥饿 +1；1 天饥饿，2 天虚弱，3 天伙伴离开（领养当天不算）。
- 明早语音：选了某一条就只播那一条；没选就把收到的全部随机轮流播一遍，然后接默认铃「晨露」直到摇完。没有明早语音时播「常用起床音效」。
- 实时叫醒：好友响铃满 5 分钟还没完成，小组页出现「叫醒」，按住录、松开发送；对方开了自动播放就直接播，否则显示「接听」。

## 网页版的限制
- 浏览器不能在锁屏/页面关掉时响铃：睡前打开 App 点「睡前开启待命」，保持页面打开、屏幕常亮、插电。
- 建议同时设一个手机自带闹钟当备份；被叫醒后 1 小时内打开 App 仍会进入摇动挑战。
- iPhone 第一次摇动需要允许「动作与方向」权限；没有运动传感器的设备会出现「按住模拟摇动」。
