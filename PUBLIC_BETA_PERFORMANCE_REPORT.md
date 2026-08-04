# Public Beta Performance Report

Date: 2026-08-04
Scope: local build and smoke only. No Lighthouse, WebPageTest, production telemetry, load test, or authenticated performance test was run.

## Decision

Performance readiness: **Pass locally, not proven for Public Beta**

Local build and smoke passed, but Public Beta performance cannot be approved without production/staging measurements on real devices, real Supabase data volume, real Google Maps calls, and authenticated workflows.

## Local Build Evidence

| Metric | Result |
| --- | --- |
| Next.js version | `16.2.11` |
| Production compile | Passed in 14.0s |
| TypeScript during build | Finished in 23.2s |
| Static page generation | 102/102 pages in 2.4s |
| Route tree | Built successfully |
| Local smoke | 47/47 checks passed |
| Mobile source gate | `MOBILE RELEASE GATE PASS` |

## Performance Risks

| Area | Risk | Severity |
| --- | --- | --- |
| Admin users/aggregates | Some admin helpers use broad aggregate/list patterns noted in prior audit | Major |
| Map discovery | Real Google Places quota/latency not tested on production domain | Major |
| Import/export | Large files and concurrency not load-tested | Major |
| Analytics dashboards | Real data volume not load-tested | Major |
| Mobile dashboard | Source gate passes; real-device performance not tested | Major |
| Third-party scripts | Analytics, maps, Sentry, Clarity, PostHog can affect TTI | Major |
| PWA cache | Sensitive routes skipped; offline/runtime behavior still needs device QA | Major |

## Required Before Re-Gate

- [ ] Run Lighthouse mobile/desktop on `https://salemap.io.vn`.
- [ ] Run smoke against deployed staging/production URL.
- [ ] Test 360px and 390px mobile dashboard workflows.
- [ ] Test authenticated dashboard, leads, tasks, pipeline, discovery, billing, and admin pages.
- [ ] Test import/export with representative files.
- [ ] Review production function logs for slow routes.
- [ ] Set basic performance budget and owner.
