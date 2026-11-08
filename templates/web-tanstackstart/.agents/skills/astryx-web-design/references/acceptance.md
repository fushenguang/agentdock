# Visual acceptance

1. `pnpm dev`, then `pnpm design:samples` for every changed route with the project theme, light and
   dark, 390x844 and 1440x900.
2. Open every image and check it against `pnpm exec astryx docs dock-visual-acceptance` and
   `pnpm exec astryx docs dock-refuse-list`, plus `DESIGN.md`.
3. Also check: no horizontal scroll at 360px; touch targets at least 44px; keyboard path and visible
   focus; both locales.
4. Fix everything you found in one batch and render again. At most two rounds; then report the
   image folder to the owner.

5. Build the production output and run the project's acceptance command. For a domain package,
   also build the package artifact, start the extracted runtime and exercise the App-hosted core
   path. Dev rendering, a mounted DOM and a passing unit test are separate weaker claims.

Screenshots are only for judging the UI. Never use them to watch CI, a pipeline, or progress.
