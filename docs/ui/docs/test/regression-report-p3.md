# Regression Report — P3 Pre-Presentation Demo Flow

- Date: 2026-11-19
- Author: ZHANGZHIYUAN, QA / Test Engineer
- Tested version: main @
  [3f8e302cd944eb17b45029b199a98046506e706e](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/commit/3f8e302cd944eb17b45029b199a98046506e706e)
- Environment: Windows, PowerShell 5.1, Python 3.12.6, npm 11.19.1.
  FILL FROM env.txt: Node.js version, browser name/version, OS caption.
- Related task: [GitHub Issue #23](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23)
- Related baseline: [Quality Report 1](quality-report-1.md) (2026-10-26, P2)
- Report status: Complete for the executed scope; raw evidence is attached to
  the Issue #23 comments linked below.

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

Commands and raw outputs are recorded in the
[automated execution comment](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7014492753)
with evidence files attached. Directories are relative to the repository root.

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
including the P3 UI-regression cases added with the recent frontend defect
fixes (PRs #20 and #21). All passed at the tested commit.

## 3. Manual results

The manual run is recorded in the
[manual execution comment](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7015276573)
with 11 screenshots and raw terminal output attached. It used the disposable
database `manual-3f8e302-run01.db`, started with `start.ps1` and `LMS_DB_PATH`,
executed in the order TC-005 → TC-002 → TC-003 → TC-004 following
`docs/ui/docs/test/test-cases.md`.

| Case | Observed result | Status |
|---|---|---|
| TC-005 login | Invalid password rejected with an on-page error; `demo` / `demo123` signed in and landed on `/orders` | PASS |
| TC-002 waybill creation | `HK202611190002` created (SKU `TECH-WM-001` × 2, receiver `QA Receiver`); visible in both Waybills and Orders as Pending pickup; stock 120 → 118; page reload created no duplicate and deducted nothing further | PASS |
| TC-003 status flow | pending → shipped → delivered persisted in both views; stock stayed 118; SQL query returned three tracking events in that order | PASS |
| TC-004 stock guard | UI showed "Exceeds available stock" and disabled submit for quantity 119; direct API POST returned HTTP 409 `{"error":"insufficient inventory"}`; stock and shipment count unchanged afterwards | PASS |
| TC-001 registration | Registration UI/API unavailable | BLOCKED |

Two earlier attempts at the direct API call failed with HTTP 400 (malformed
JSON) and HTTP 401 (expired token after a server restart). Both were
tester-side request issues, not product defects; the final 409 run used the
attached `waybill-409.json` request body.

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

After this regression run, `main` advanced to `e9f06c2` ("Add User Manual").
Diff review shows it touches only `USER_MANUAL.md` (+1 −2), a documentation
file with no effect on the demo flow or any tested code path. The regression
conclusions in this report therefore remain valid for the current `main`.
If any code change merges before the presentation, the affected automated
suites and the manual demo path must be rerun.

## 7. Risks and limitations

- Frontend workflow tests exercise the API layer; browser-level behaviour is
  covered by the manual run and the P3 UI-regression suite, not by automated
  browser tests.
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

- [Automated execution comment](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7014492753)
  — command outputs per check (`python-tests-main-3f8e302.txt`,
  `frontend-tests-main-3f8e302.txt`, `frontend-lint-main-3f8e302.txt`,
  `frontend-build-main-3f8e302.txt`, `windows-startup-main-3f8e302.txt`),
  the environment record (`env.txt`) and terminal screenshots.
- [Manual execution comment](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23#issuecomment-7015276573)
  — 11 screenshots covering login, inventory, waybill creation, status
  transitions and the HTTP 409 response; raw terminal output
  (`manual-api-main-3f8e302.txt`); the request body (`waybill-409.json`).
- [Docker evidence comment](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/issues/23)
  — CI run link for the Docker build and published-port health check.

Unlike Quality Report 1, all raw evidence for this run is shared in the linked
Issue comments, and the environment was recorded before execution.

## 9. Conclusion and next steps

All automated suites (99 Python tests, 15 frontend tests, lint, production
build, 7 Windows startup tests) and the manual demo flow passed at
`3f8e302`, with TC-001 still blocked by missing registration scope. The demo
flow has no blocking defects and is ready for the P3 presentation.

Next steps:

1. Before the presentation, check whether `main` received code changes since
   `3f8e302`; rerun the affected checks if so (documentation-only changes
   only need to be recorded, as in section 6).
2. Investigate the dependency audit items without applying automatic fixes.
3. For P4 finalisation, plan the full regression with the integration test
   dataset under review on branch `integration-testing` (18 API cases plus
   negative/boundary data).
4. Agree on acceptance rules for unimplemented logistics modules.
