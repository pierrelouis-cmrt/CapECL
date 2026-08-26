# CapECL

## Automated build

Every push to `main` runs `.github/workflows/build.yml`. The workflow copies the
static site, adds the first eight characters of each file's SHA-256 digest to
`styles.css` and `script.js`, updates the local HTML references, and publishes
the generated site to the `build` branch.

The `build` branch is generated output and should not be edited manually.
Site fait par et pour les étudiants de CapECL regroupant outils et ressources utiles.
