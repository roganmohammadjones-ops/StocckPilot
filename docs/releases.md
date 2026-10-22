# Release builds and GitHub Pages

The release workflow retains Expo SDK 57, NativeWind 4.2.7, the existing native
prebuild/Gradle build, and the original root-hosted web export.

## One-time Pages setup

A repository administrator must open **Settings > Pages > Build and deployment**
and select **GitHub Actions** as the Source. This enables Pages; adding
`pages: write` to a workflow alone does not enable it. `configure-pages@v5`
cannot bootstrap Pages with the automatic `GITHUB_TOKEN`.

The Pages URL is https://roganmohammadjones-ops.github.io/StocckPilot/.
Keep the existing EAS Hosting target, domains, and DNS unchanged. The Pages bundle
uses `/StocckPilot` as `experiments.baseUrl`; only that export sets
`STOCKPILOT_WEB_BASE_PATH`. A custom Pages domain would require reviewing this
base path before deploying.

Use the `github-pages` environment. If its deployment branch rules are restricted,
allow `main`; retain any required reviewers. The deployment job needs `pages: write`
and `id-token: write`, provided in the workflow. Organization policies must allow
the referenced Actions and Pages hosting.

## Validation and artifacts

Pull requests targeting main run typecheck, lint, the full Android APK build,
and both web exports without deploying or creating a GitHub Release.
Manual runs default to build-only. Enable `deploy_web` on main to deploy after both
builds succeed. Pushes to main also deploy after both builds succeed.

Download the `StockPilot-Nigeria-APK` artifact for the versioned APK, stable
`StockPilot-Nigeria.apk`, and SHA256SUMS. The build checks the APK exists and is a
valid ZIP archive. These are build checks, not device/runtime acceptance or
production-signing verification. The existing Expo-generated signing setup is
preserved; review its signing identity before distributing a production APK.

`StockPilot-Web-Production` retains the root-hosted export, including 404.html.
The separate `github-pages` artifact contains the repository-prefixed web export.
The existing EAS deployment is not invoked or modified by this workflow.

New v* tag pushes prepare a **draft** release only after both builds pass. They do
not deploy Pages. Main pushes and manual runs no longer overwrite the fixed
v1.0.3 release. Before publishing a draft, inspect the artifacts and signing,
smoke-test the APK on a device and the web app in a browser, and approve the release.
Do not rerun an old failed workflow to test these changes: retries use the old
commit/workflow. Run the corrected branch/commit instead.
