// Run after changing homepage markup or its shared styles: node tools/optimize-home.cjs
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const css = require(process.env.LIGHTNINGCSS_PATH || 'lightningcss');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(__dirname, '../docs');
const files = ['base.css', 'theme.css', 'refined.css', 'reference-airy.css', 'ui/vendor/open-props-gradients.css', 'footer.css', 'footer-actions.css'];
const digest = data => crypto.createHash('sha256').update(data).digest('hex').slice(0, 12);

async function main() {
  const htmlPath = path.join(root, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const classes = new Set([...html.matchAll(/\bclass="([^"]*)"/g)].flatMap(match => match[1].split(/\s+/)));
  // Keep all classes mentioned by enhancement scripts, including menu and toast states.
  const scripts = fs.readdirSync(path.join(root, 'style-a1')).filter(name => name.endsWith('.js'))
    .map(name => fs.readFileSync(path.join(root, 'style-a1', name), 'utf8')).join('\n');
  let removed = 0;
  const sources = files.map(name => {
    const filename = path.join(root, 'style-a1', name);
    return css.transform({filename, code: fs.readFileSync(filename), visitor: {
      Rule: {style(rule) {
        // Only discard selectors with a mandatory, top-level class absent from
        // both the HTML and scripts. Leave :is(), :not(), :has(), states,
        // attributes, global rules and keyframes intact.
        const selectors = rule.value.selectors.filter(selector => !selector.some(token =>
          token.type === 'class' && !classes.has(token.name) && !scripts.includes(token.name)));
        if (!selectors.length) {
          removed += rule.value.selectors.length;
          return [];
        }
      }},
      Url(url) {
        if (/^(?:[a-z]+:|\/|#)/i.test(url.url)) return;
        url.url = path.relative(path.join(root, 'style-a1'), path.resolve(path.dirname(filename), url.url)).replaceAll('\\', '/');
        return url;
      }
    }}).code.toString();
  });
  const packed = css.transform({filename: 'home.min.css', code: Buffer.from(sources.join('\n')), minify: true}).code;
  fs.writeFileSync(path.join(root, 'style-a1/home.min.css'), packed);
  // Inline the complete, page-specific CSS: no deferred styling or flash of
  // unstyled content, and fonts become discoverable directly from the HTML.
  const inline = css.transform({filename:'index.html', code:packed, minify:true, visitor:{Url(url) {
    if (/^(?:[a-z]+:|\/|#)/i.test(url.url)) return;
    url.url = path.relative(root, path.resolve(root, 'style-a1', url.url)).replaceAll('\\', '/');
    return url;
  }}}).code;
  const style = `<style id="home-styles">${inline.toString().replaceAll('</style', '<\\/style')}</style>`;
  if (html.includes('<style id="home-styles">')) html = html.replace(/<style id="home-styles">[\s\S]*?<\/style>/, style);
  else {
    let first = true;
    html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, tag => {
      if (!files.some(name => tag.includes(`style-a1/${name}?`))) return tag;
      if (first) {first = false; return style;}
      return '';
    });
  }

  const source = path.join(root, 'assets/hero-1536.webp');
  const outputs = [];
  for (const width of [768, 1536]) {
    const name = `hero-home-${width}.avif`;
    await sharp(source).resize({width}).avif({quality: 55, effort: 6}).toFile(path.join(root, 'assets', name));
    outputs.push(name);
  }
  // The mobile hero uses object-position:70% center. Crop at the same anchor;
  // subsequent cover-cropping preserves the original composition.
  for (const width of [400, 640, 1075]) {
    for (const format of ['avif', 'webp']) {
      const name = `hero-home-mobile-${width}.${format}`;
      await sharp(source).extract({left:323, top:0, width:1075, height:1024}).resize({width})
        .toFormat(format, {quality: format === 'avif' ? 55 : 77, effort: 6}).toFile(path.join(root, 'assets', name));
      outputs.push(name);
    }
  }
  const srcset = (prefix, widths, format) => widths.map(width => {
    const name = `${prefix}${width}.${format}`;
    return `assets/${name}?v=${digest(fs.readFileSync(path.join(root, 'assets', name)))} ${width}w`;
  }).join(', ');
  const image = html.match(/<img\b[^>]*class="hero-photo"[^>]*>/)[0];
  const fallback = image.replace(/srcset="[^"]*"/, 'srcset="assets/hero-768.webp 768w, assets/hero-1536.webp 1536w"')
    .replace(/sizes="[^"]*"/, 'sizes="(max-width:900px) calc(100vw - 48px), (max-width:1100px) 65vw, 900px"');
  const picture = `<picture class="hero-picture"><source media="(max-width:620px)" type="image/avif" srcset="${srcset('hero-home-mobile-', [400,640,1075], 'avif')}" sizes="(max-width:420px) 540px, 630px"><source media="(max-width:620px)" type="image/webp" srcset="${srcset('hero-home-mobile-', [400,640,1075], 'webp')}" sizes="(max-width:420px) 540px, 630px"><source type="image/avif" srcset="${srcset('hero-home-', [768,1536], 'avif')}" sizes="(max-width:900px) calc(100vw - 48px), (max-width:1100px) 65vw, 900px">${fallback}</picture>`;
  if (html.includes('<picture class="hero-picture">')) html = html.replace(/<picture class="hero-picture">[\s\S]*?<\/picture>/, picture);
  else html = html.replace(image, picture);

  for (const name of ['schools-47-560-278-142', 'schools-339-560-280-142', 'schools-634-560-269-142']) {
    const target = `${name}-home.webp`;
    await sharp(path.join(root, 'assets', `${name}.webp`)).webp({quality:65, effort:6}).toFile(path.join(root, 'assets', target));
    html = html.replace(new RegExp(`assets/${name}(?:-home)?\\.webp(?:\\?v=[a-z0-9]+)?`, 'g'), `assets/${target}?v=${digest(fs.readFileSync(path.join(root, 'assets', target)))}`);
  }
  // CSS already substitutes this footer logo. Use that same URL directly to
  // avoid first downloading the unused original logo as well.
  html = html.replace(/<img src="assets\/logo\.svg" width="1612"/, '<img src="assets/logo-footer.svg?v=2" width="1612"');
  fs.writeFileSync(htmlPath, html);
  const original = files.reduce((sum, name) => sum + zlib.gzipSync(fs.readFileSync(path.join(root, 'style-a1', name))).length, 0);
  console.log(JSON.stringify({removedSelectors:removed, originalCssGzip:original, homeCssGzip:zlib.gzipSync(packed).length, homeHtmlGzip:zlib.gzipSync(html).length, images:outputs.map(name=>({name, bytes:fs.statSync(path.join(root,'assets',name)).size}))}, null, 2));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
