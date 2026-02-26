# Prototypes Versioning Convention

A partir de ahora, cada iteración de un mockup se guarda con sufijo de versión dentro de su carpeta:

- `index-v1.html`, `app-v1.js`, `styles-v1.css`, `report-v1.html`
- `index-v2.html`, `app-v2.js`, `styles-v2.css`, `report-v2.html`
- etc.

Además, se mantiene un alias estable para la versión actual:

- `index.html` -> última versión
- `app.js` -> última versión
- `styles.css` -> última versión
- `report.html` -> última versión

Si no existe el archivo versionado anterior, la trazabilidad queda en Git history.
