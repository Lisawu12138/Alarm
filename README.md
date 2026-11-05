# Alarm

A commitment-based wake-up prototype for iOS, Android and browser demonstrations.

## Run

Node 22.13+ is recommended.

```sh
npm ci
npm run web
```

For iOS/Android: `npx expo start --tunnel`, then scan the Expo QR code with an
SDK 54-compatible Expo Go client or use a development build. Native-device
compatibility must be verified on both platforms; a browser pass is not a
native-device certification.

## Demo

1. Set a 24-hour time and select a commitment.
2. Enter a wake-up message, or grant microphone permission and record a voice
   with the speaker's consent. Recording is session-only; settings are local.
3. Open the task QR code on a second screen or print it and place it away from
   the bed.
4. Press **立即试响**, then **起床，开始扫码**.
5. Scan the task QR code. If a camera is unavailable, use the explicitly labeled
   simulated scan, then manually count ten squats or seated stretches.
6. Finish the task to see success, or abandon it to see the chosen commitment.

## Boundaries

- This is an interactive prototype, not a reliable daily alarm.
- The time toggle runs only while the application is active. It is reset on
  reload and turned off when triggered. Background/locked/terminated operation,
  notifications, repeating alarms, and OS alarm APIs are not implemented.
- Speech synthesis or the recorded voice plays once, not an endless ringtone.
  Browser autoplay policies and device sound settings may prevent playback.
- QR verification checks the demo payload, not identity or wakefulness. The
  same demo code is shared across installations and can be copied.
- Squats/stretching use manual taps, not computer vision or motion detection.
- Money is simulated; there are no payment integrations or real charges.
- No accounts, uploads, or server database. Microphone access is opt-in.
- Recordings are temporary and are not restored after restarting the app.

## Checks

```sh
npm run typecheck
npm run build:web
```

Before claiming mobile support, test microphone permission (allow/deny),
record/play/delete, camera permission (allow/deny), correct/incorrect QR codes,
the success and abandon flows, and text readability on real iOS and Android
devices. The browser preview exercises shared UI, not native alarm reliability.
