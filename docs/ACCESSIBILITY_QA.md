# Accessibility QA checklist

Use this checklist after navigation, metadata, checkout, or public order page changes.

## Keyboard checks

- Header navigation links can be reached with Tab.
- Product cards can be reached and opened with keyboard navigation.
- Visible path trail links can be reached with Tab.
- Product checkout form fields can be reached in a logical order.
- Product inquiry form fields can be reached in a logical order.
- Admin forms remain keyboard accessible after CMS changes.

## Path trail checks

On category pages:

- Path trail is announced as navigation.
- Home item is a link.
- Current category item is not a link.
- Current category item has `aria-current="page"`.

On product pages:

- Path trail is announced as navigation.
- Home item is a link.
- Category item is a link.
- Current product item is not a link.
- Current product item has `aria-current="page"`.

## Public order status checks

For `/orders/<token>?locale=fa`:

- Page direction is RTL.
- Order number remains readable left-to-right.
- Total amount remains readable left-to-right.
- Item quantity remains readable left-to-right.
- Language links remain readable and stable.

For `/orders/<token>?locale=en`:

- Page direction is LTR.
- Labels remain English.

## Metadata route checks

- `/sitemap.xml` is reachable.
- `/robots.txt` is reachable.
- Neither route traps keyboard focus or renders visible app chrome.

## Form checks

- Product checkout form labels are visible.
- Required fields are understandable.
- Error/status messages are close to the related form.
- Inquiry form labels are visible.
- Inquiry form success/error status is announced clearly in nearby page content.

## Deferred automated coverage

- Add Playwright keyboard smoke tests.
- Add axe-core checks in CI or preview.
- Add focused screen-reader QA before launch.
