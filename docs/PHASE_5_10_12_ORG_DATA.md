# Phase 5.10-5.12 organization data

This bundle adds global Organization and WebSite JSON-LD.

## Added foundation

- `buildOrganizationJsonLd()` helper.
- `buildWebSiteJsonLd()` helper.
- Root layout renders Organization JSON-LD once.
- Root layout renders WebSite JSON-LD once.

## Current fields

Organization:

- name
- URL
- logo URL
- description

WebSite:

- name
- URL
- description

## Deferred

- Real logo asset review.
- LocalBusiness fields.
- SearchAction structured data.
- Social profile links.
- Store address and contact schema.
