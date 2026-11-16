# Internal Release v0.1

## Project

Logistics Management System

## Release Version

The `v0.1` tag on the release owner's fork points to team commit `0093de1`.
Use this snapshot for repeatable test results. [Published release](https://github.com/alvin-afk54/COMP3500SEF-Group-Project/releases/tag/v0.1) · [Source at 0093de1](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/tree/0093de19fff38f810bcd83e1dca2f3fb52e445eb)

## Release Type

Internal Pre-release

## Overview

This is the first internal release of the Logistics Management System.

## Purpose

This release is prepared for internal team testing and review.

## Testing

The automated build and test workflow passed for `0093de1`. [CI results for the release commit](https://github.com/xulanxin30-tech/COMP3500SEF-Group-Project/actions/runs/43577381536)

1. Start the source snapshot above with Python 3 and Node.js 22.12 or later. Set `LMS_DB_PATH` to a new SQLite file in an existing directory so the stock checks start from the seed data. On Windows, run `.\start.ps1` from the repository root. [Setup on Windows, macOS and Linux](README.md#run-the-examples-locally)
2. Sign in with the local demo account (`demo` / `demo123`). In Waybills, create a waybill for two units of `TECH-WM-001`. Check that it appears in Orders and that Inventory falls from 120 to 118. Mark the shipment as in transit and check that stock stays at 118.
3. Record the tested commit, steps, expected and actual results when reporting feedback. [QA test cases and evidence fields](docs/ui/docs/test/test-cases.md)

## Notes

This is an early development version and is not intended for production use.
