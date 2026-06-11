# Homepage category tile copy panel

Some source category images include baked-in campaign text. The storefront category tile also renders live CMS/category copy, so the previous transparent overlay could place live titles/descriptions directly over image text.

This slice updates `HomepageCategoryTileCard` to keep live copy inside a tinted panel with backdrop blur, while biasing the image focal position toward the opposite side of the card. The change keeps existing images usable without requiring every image to be text-free.

Guard coverage lives in `tests/unit/homepage-category-assets.test.ts` and verifies that the card no longer uses the old transparent overlay pattern.
