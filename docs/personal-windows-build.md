# Personal Windows build

Built locally on 25 October 2026 from LearnHarness 0.3.7.

## Open the app

From the repository's PowerShell terminal:

```powershell
& .\dist\win-unpacked\LearnHarness.exe
```

Keep the entire `win-unpacked` folder together. Alternatively, run
`dist/LearnHarness-0.3.7-x64-setup.exe` to install the local build.
Subscription sign-in requires this desktop app; `npm run dev` remains browser-only.
No accounts were signed in and no paid model requests were made during validation.

## Changes

- Updated Next.js to 16.4.3, Electron to 44.9.3, Puppeteer Core to 25.16.0,
  Zod to 4.6.7, concurrently to 10.0.6, and affected transitive dependencies.
- Removed unused `ansi-to-react` and its vulnerable dependency chain.
- Disabled update checks and downloads, including manual checks, in the launcher.
  Future updates must be reviewed and built manually so upstream installers do
  not replace the local changes.

The installer remains unsigned. The credential-storage and generated-content
hardening concerns discussed in the review were outside this approved scope.
Credentials remain unencrypted on disk; zero npm advisories is not a complete
security assessment.

## Validation

- npm audit after dependency installation: zero known vulnerabilities.
- Type check, lint, production build: passed.
- Full suite: 2,117 passed, 13 failed. The same 13 tests failed before changes
  (2,116 passed); the added updater regression test passed.
- Native PDF/SVG rendering and browser-helper unit tests in Electron: 18 passed.
- Standalone server: home page and graph, models, settings APIs returned HTTP 200.
- Actual packaged browser helper: JavaScript interaction, page reset, and clean
  shutdown passed without falling back to system Chrome.
- Actual packaged authentication dependencies initialized offline successfully.
- Packaged launcher matched the edited source; root credentials and learning
  data were absent from the packaged server payload.

Full-suite failures predate the patches: credential POSIX-mode assertions on
Windows, path/module-loading assertions, a golden-fixture assertion, and release
CLI tests. See `baseline-tests.log` and `updated-tests.log` for exact results.
The suite is not entirely green; real account sign-in and a complete lesson
still require user verification.

## Rebuild on Windows

Use this updated lockfile containing the reviewed dependencies:

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
node scripts/smoke-provider-runtime.mjs
node scripts/build-server.mjs
node scripts/smoke-server.mjs --electron
npx --no-install electron-builder --win --x64 --publish never
```

`desktop:dist` is the upstream macOS build script; use the Windows commands above.
Logs from this build are in `desktop-build.log`, `native-render-tests.log`, and
`windows-package.log`. Build output and these logs are ignored by Git.
