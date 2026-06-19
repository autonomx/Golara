# Admin analytics layout refinement runbook

This page summarizes the layout pass for `/admin/analytics`.

## Why this is needed

The Analytics page now has many useful panels. The next UI pass should make it easier to scan and navigate.

## Live preview contract

A preview-only layout contract now maps the existing dashboard anchors into six groups while preserving the selected range and current section links:

- Overview
- Business
- Site
- Products and categories
- Operations
- Privacy and docs

The contract keeps group headers, collapsible groups, and tabbed workspace behavior disabled until a separate UI implementation pass.

## First UI implementation slice

Add stronger section group headers while keeping the current section index, range links, CSV exports, and accessible chart tables.

## Later options

After group headers are stable, consider collapsible sections or a tabbed workspace.
