# Admin analytics layout refinement runbook

This page summarizes the layout pass for `/admin/analytics`.

## Why this is needed

The Analytics page now has many useful panels. The layout pass makes it easier to scan and navigate.

## Live group headers

The page now renders static dashboard group headers generated from the layout contract:

- Overview
- Business
- Site
- Products and categories
- Operations
- Privacy and docs

These headers preserve the selected range and current section links.

## What stays unchanged

The current section index, range links, CSV exports, server-rendered panels, existing anchors, and accessible chart tables remain in place.

## Later options

After group headers are stable, consider collapsible sections or a tabbed workspace only if the page still feels crowded.
