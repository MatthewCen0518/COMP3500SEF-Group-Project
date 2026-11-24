# Regression Report — P3 Pre-Presentation Demo Flow

- Date: 2026-11-19
- Author: ZHANGZHIYUAN, QA / Test Engineer
- Tested version: main @
  [3f8e302cd944eb17b45029b199a98046506e706e](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/commit/3f8e302cd944eb17b45029b199a98046506e706e)
- Original QA environment: Windows, PowerShell 5.1, Python 3.12.6 and npm
  11.19.1 as recorded by the author. Exact Windows, Node.js and browser
  versions for that run remain unverified.
- Verification run (2026-11-20, GeorgeXie2333): Windows 11 Home 25H2
  (build 26200.9974), PowerShell 7.6.9, Windows PowerShell 5.1.26100.9818
  for the launcher, Python 3.13.3, Node.js 24.14.0, npm 11.9.0 and
  Chromium 157.0.8103.79 (Playwright, headless).
- Related task: [GitHub Issue #23](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23)
- Related baseline: [Quality Report 1](quality-report-1.md) (2026-10-26, P2)
- Report status: Complete for the executed demo scope. Section 8 links the
  original QA summaries and the evidence captured during verification.

## 1. Purpose and scope

Confirm that the P3 presentation demo flow on current `main` has no blocking
defects before the team presentation. The demo flow is: sign in with the demo
account, create a waybill (stock is deducted atomically), move the shipment
through `pending` → `shipped` → `delivered`, and confirm that over-stock
orders are rejected.

The regression combines the full automated suites and a manual browser run of
TC-005 → TC-002 → TC-003 → TC-004 on a fresh disposable database. It does not
cover unimplemented modules (registration, tracking timeline UI, dispatch),
production deployment or the complete business workflow.

A change on `main` after this run is assessed in section 6.

## 2. Automated results

The [original automated execution comment](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7014492753)
records the results below. Directories are relative to the repository root.
The [verification transcript](evidence/p3-3f8e302/automated.txt) confirms the same
test counts, lint and production build at the same commit. It records the
versions, commands and outputs from the independent run.

| Check | Working directory | Command (PowerShell) | Result | Status |
|---|---|---|---|---|
| Dependency install | `frontend/` | `npm.cmd ci` | 329 packages added; audit reports 8 vulnerabilities (7 moderate, 1 high) — recorded as a risk item, no automatic fix applied | DONE |
| Python unittest discovery | Repository root | `py -3 -m unittest discover -s tests -v` | 99 run, 0 failures, 0 errors | PASS |
| Frontend tests | `frontend/` | `npm.cmd test` | 15 run, 15 passed, 0 failed | PASS |
| ESLint with zero warnings allowed | `frontend/` | `npm.cmd run lint -- --max-warnings=0` | No errors or warnings | PASS |
| TypeScript and Vite production build | `frontend/` | `npm.cmd run build` | `✓ built in 4.20s`, exit code 0 | PASS |
| Windows startup suite | Repository root | `py -3 -m unittest discover -s tests/windows -v` | 7 run, 0 failures, 0 errors, 0 skipped | PASS |

Compared with Quality Report 1 (83 Python tests at the P2 baseline), the Python
suite now runs 99 tests and the frontend suite has grown from 5 to 15 tests,
including request handling and timestamp cases from [PR #20](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/pull/20).
[PR #21](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/pull/21) added seven Python API handler tests.
All passed at the tested commit.

## 3. Manual results

The manual run is recorded in the
[manual execution comment](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7015276573)
with screenshots from the disposable database `manual-3f8e302-run01.db`.
QA started the system with `start.ps1` and `LMS_DB_PATH`, then followed
TC-005 → TC-002 → TC-003 → TC-004 in the [manual test plan](test-cases.md).
The table records the original run.

| Case | Observed result | Status |
|---|---|---|
| TC-005 login | Invalid password rejected with an on-page error; `demo` / `demo123` signed in and landed on `/orders` | PASS |
| TC-002 waybill creation | `HK202611190002` created (SKU `TECH-WM-001` × 2, receiver `QA Receiver`); visible in both Waybills and Orders as Pending pickup; stock 120 → 118; page reload created no duplicate and deducted nothing further | PASS |
| TC-003 status flow | pending → shipped → delivered persisted in both views; stock stayed 118; SQL query returned three tracking events in that order | PASS |
| TC-004 stock guard | UI showed "Exceeds available stock" and disabled submit for quantity 119; direct API POST returned HTTP 409 `{"error":"insufficient inventory"}`; stock and shipment count unchanged afterwards | PASS |
| TC-001 registration | Registration UI/API unavailable | BLOCKED |

Two earlier attempts at the direct API call failed with HTTP 400 (malformed
JSON) and HTTP 401 (expired token after a server restart). Both were
request preparation errors. The independent run recorded its own JSON
request and HTTP 409 response in the
[manual transcript](evidence/p3-3f8e302/manual.txt).

## 4. Docker build and health check

Docker Desktop is not installed on the QA machine, so this check is cited from
CI: the `Build and Test` workflow's `build-and-test` job builds the Docker
image, starts the container with a published port and asserts the
`/api/health` JSON on every push to `main`. The
[CI run for the tested commit](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/actions/runs/44366086884)
completed successfully. No local Docker verification was performed for this
run.

## 5. Confirmed defects

No blocking defect was found on the demo flow, and no new product defect was
confirmed during this regression run. This statement applies only to the
executed scope at the tested commit; it does not mean the whole system is
defect-free.

## 6. Post-run change on main

By the verification review on 2026-11-20, `main` had advanced to
[`5b68bfb`](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/commit/5b68bfb57d9e55ecd5a31cc6dde45abf20958fcd)
through [PR #22](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/pull/22).
The [comparison with the tested commit](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/compare/3f8e302cd944eb17b45029b199a98046506e706e...5b68bfb57d9e55ecd5a31cc6dde45abf20958fcd)
shows one added file, `USER_MANUAL.md`. The tested code and dependencies
match at both revisions. If a code change merges before the presentation,
rerun the affected automated suites and the manual demo path.

## 7. Risks and limitations

- The frontend suites exercise the API workflow, request handling and
  timestamp formatting. The browser checks are recorded with the manual
  scenario and verification screenshots.
- The dependency audit reports 8 vulnerabilities (7 moderate, 1 high); the
  affected packages and exploitability are not yet investigated, and no
  automatic fix has been applied (carried over from Quality Report 1).
- Registration (TC-001), the tracking timeline UI and several placeholder
  modules remain outside the implemented or executable scope.
- Docker was verified through CI only, not on the QA machine.
- Public read APIs, demo credentials, process-local tokens and unrestricted
  transitions among supported statuses remain open product-risk items noted
  in Quality Report 1.
- Results apply only to the tested commit and the recorded environment.

## 8. Evidence

- Original QA run (2026-11-19). Issue #23 contains the
  [automated summary and screenshots](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7014492753)
  and [manual summary and screenshots](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7015276573).
  The original environment file and text transcripts were unavailable through
  those links.
- Independent verification (2026-11-20). The
  [automated transcript](evidence/p3-3f8e302/automated.txt) records the environment
  and full check outputs. The [manual transcript](evidence/p3-3f8e302/manual.txt)
  records the new shipment, stock and row counts, tracking event SQL and
  output, and the direct HTTP 409 request and response.
- Browser screenshots from the verification database.
  [Invalid sign-in](evidence/p3-3f8e302/01-invalid-login.png),
  [new pending waybill](evidence/p3-3f8e302/02-pending-waybill.png),
  [delivered in Waybills](evidence/p3-3f8e302/03-delivered-waybill.png), and
  [over-stock form guard](evidence/p3-3f8e302/04-over-stock.png).
- [Docker build and published-port health check](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/actions/runs/44366086884)
  for `3f8e302`.

## 9. Conclusion and next steps

All automated suites (99 Python tests, 15 frontend tests, lint, production
build, 7 Windows startup tests) and the manual demo flow passed at
`3f8e302` in both runs. TC-001 remains blocked by missing registration scope.
The demo flow has no blocking defects in the tested scope and is ready for
the P3 presentation.

Next steps:

1. Before the presentation, check whether `main` received code changes since
   `3f8e302`; rerun the affected checks if so (documentation-only changes
   only need to be recorded, as in section 6).
2. Investigate the dependency audit items without applying automatic fixes.
3. For P4 finalisation, plan the full regression with the integration test
   dataset under review on branch `integration-testing` (18 API cases plus
   negative/boundary data).
4. Agree on acceptance rules for unimplemented logistics modules.
