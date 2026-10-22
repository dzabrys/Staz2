# Locally bundled UI assets

- Culori 4.0.2: https://github.com/Evercoder/culori (MIT, Dan Burzo). Pinned npm distribution `bundled/culori.cjs`, with `culori-LICENSE.txt`. Used only by `tools/build-footer-studio.cjs` to generate 41-stop OKLab colour ramps for the static footer SVGs. No browser dependency or network request.

- Open Props 1.7.23: https://github.com/argyleink/open-props/tree/f39ab7c377a0e047f930982e3611bbc95254a260 (MIT). Selected spacing, border-radius, shadow and easing tokens only. Scoped to `.contact-ready`, `.custom-proposal` and `.company-polished`; no normalize or global theme.
- Lucide: https://github.com/lucide-icons/lucide/tree/02eb9161b57917ccaa262f1bf070507cddde3b08 (ISC / MIT, see license). Six SVGs, embedded directly into the contact, custom-games and company HTML. No icon JavaScript or CDN.
- Licenses are kept alongside the assets. These snapshots are pinned to commits, so deployments do not depend on a moving CDN URL.

- `open-props-gradients.css`: Open Props 1.7.23, same pinned commit above. Bundles upstream `src/props.gradients.css` and `src/props.orange.css`; only the selectors change from `:where(html)` to `:where(body.audience-compact)`. The audience offer panels use the library's adaptive `--gradient-space` (OKLab where supported) and orange palette with the existing brand orange. Loaded only by `szkoly1.html` and `firmy1.html`.

- Footer update: gradient tokens are additionally scoped to `.a-brand-footer` and loaded by all variant-1 footers. The white light accents use upstream `--gradient-29`, neutralised to white, and its adaptive `--gradient-space` for smooth interpolation inside the small white wave masks. The orange/navy wave artwork has no blur filter.
