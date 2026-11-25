import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const files = [
  'index.html',
  'ultima_history.html',
  'home-base.css',
  'UltimaPortal_Main.css',
  'ultima_history.css',
  'era-selector.css',
  'images',
  'middle',
  'end',
];

function findDivRange(content, className) {
  const opening = [...content.matchAll(/<div\b[^>]*>/gi)].find((tag) => {
    const classes = tag[0].match(/\bclass=["']([^"']*)["']/i)?.[1].split(/\s+/) ?? [];
    return classes.includes(className);
  });
  if (!opening) return null;

  const divTags = /<\/?div\b[^>]*>/gi;
  divTags.lastIndex = opening.index;
  let depth = 0;
  for (const tag of content.matchAll(divTags)) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return { start: opening.index, end: tag.index + tag[0].length };
  }
  return null;
}

function removeDivsByClass(content, className) {
  while (true) {
    const range = findDivRange(content, className);
    if (!range) return content;
    content = content.slice(0, range.start) + content.slice(range.end);
  }
}

function timelineEmbed(profile, author) {
  return `<div class="timeline-slot"><a class="twitter-timeline" data-width="280" data-height="360" href="${profile}">Posts by ${author}</a></div>`;
}

function restoreArchivePage(content, file) {
  const suffix = file.match(/-(de|fr|jp|ko|ru)\.html$/)?.[1];
  const languageSuffix = suffix ? `-${suffix}` : '';
  const isFaq = file === 'faq.html';
  const isAbout = file.startsWith('about');
  const homePage = `index${languageSuffix}.html`;
  const aboutPage = `about${languageSuffix}.html`;

  content = content.replace(
    /<div class="navigation">[\s\S]*?<\/div>/i,
    `<div class="navigation"><ul><li${isAbout || isFaq ? '' : ' class="active"'}>${isAbout || isFaq ? `<a href="${homePage}">Home</a>` : 'Home'}</li><li${isAbout ? ' class="active"' : ''}>${isAbout ? 'About' : `<a href="${aboutPage}">About</a>`}</li><li class="forums-menu"><details><summary>Forums</summary><ul><li><a href="https://web.archive.org/web/20140209184020/http://forums.ultimaforever.com/" target="_blank" rel="noopener noreferrer">Archive</a></li><li><a href="https://discord.com/channels/179598067379470336/1559298782099800115" target="_blank" rel="noopener noreferrer">Discord</a></li></ul></details></li><li${isFaq ? ' class="active" aria-current="page"' : ''}>${isFaq ? 'FAQ' : '<a href="faq.html">FAQ</a>'}</li></ul></div>`,
  );
  if (isFaq) {
    content = content.replace(/<\/head>/i, '<link rel="stylesheet" href="../era-selector.css">\n</head>');
    content = content.replace(/<body\b[^>]*>/i, (bodyTag) => `${bodyTag}\n${eraNavigation()}`);
    return content;
  }

  content = content.replace(/<!--[\s\S]*?-->/g, '');
  content = content.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  content = content.replace(/<link\b[^>]*href=["']css\/(?:rcarousel|jquery\.tweet|lightbox)\.css["'][^>]*\/?\s*>/gi, '');
  content = removeDivsByClass(content, 'fblike');
  content = content.replace(/<div\b[^>]*id=["']fb-root["'][^>]*>\s*<\/div>/gi, '');
  content = content.replace(
    /href="https:\/\/www\.facebook\.com\/UltimaForever(?:\?fref=ts)?"/gi,
    'href="https://www.facebook.com/search/top?q=UltimaForever"',
  );
  content = content.replace(
    /(<div class="social">[\s\S]*?<ul>[\s\S]*?)(<\/ul>)/i,
    '$1<li class="discord-link"><a href="https://discord.com/channels/179598067379470336/1559298782099800115" target="_blank" rel="noopener noreferrer" aria-label="Join Ultima Forever on Discord"><img src="images/discord.svg" alt="" width="55" height="55" /></a></li><li class="x-link"><a href="https://x.com/CearDragon" target="_blank" rel="noopener noreferrer" aria-label="Follow CearDragon on X"><img src="images/x.svg" alt="" width="55" height="55" /></a></li>$2',
  );
  content = content.replace(/href="index--524f344955\.html"/g, `href="${homePage}"`);
  content = content.replace(
    /href="https?:\/\/web\.archive\.org\/web\/[^"']*\/http:\/\/www\.ultimaforever\.com\/download"/gi,
    'href="https://apps.apple.com/us/app/ultima-forever-quest-for-the-avatar/id591550134"',
  );
  content = content.replace(
    /href="http:\/\/www\.youtube\.com\/user\/eamobilegames"/gi,
    'href="https://www.youtube.com/playlist?list=PLEhw1ePxp4uM"',
  );
  content = content
    .replace(/src="[^"]*header_logo-ru\.png"/gi, 'src="images/header_logo.png"')
    .replace(/src="[^"]*button_learnmore_ru\.png"/gi, 'src="images/button_learnmore.png"')
    .replace(/src="[^"]*app_ru\.png"/gi, 'src="images/appbadges/app_en.png"');
  content = content.replace(
    /<iframe\b(?=[^>]*src=["'][^"']*jMfBczn7pH8)[^>]*><\/iframe>/i,
    '<iframe class="trailer-video" src="https://www.youtube-nocookie.com/embed/jMfBczn7pH8?rel=0" title="Ultima Forever: Quest for the Avatar trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
  );
  content = content.replace(
    /<div class="tweet"><\/div>/i,
    timelineEmbed('https://x.com/UltimaForever?ref_src=twsrc%5Etfw', 'UltimaForever'),
  );
  if (!isAbout) {
    content = content.replace(
      /(<div class="socialicons">[\s\S]*?)(<\/div>)/i,
      '$1<a class="discord-link" href="https://discord.com/channels/179598067379470336/1559298782099800115" target="_blank" rel="noopener noreferrer" aria-label="Join Ultima Forever on Discord"><img src="images/discord.svg" alt="" width="55" height="55" /></a><a class="x-link" href="https://x.com/CearDragon" target="_blank" rel="noopener noreferrer" aria-label="Follow CearDragon on X"><img src="images/x.svg" alt="" width="55" height="55" /></a>$2',
    );
    const facebookPanel = findDivRange(content, 'contentsocialend');
    if (facebookPanel) {
      content = content.slice(0, facebookPanel.start)
        + '<div class="contentsocialend">\n'
        + '<div class="header">X</div>\n'
        + timelineEmbed('https://x.com/CearDragon?ref_src=twsrc%5Etfw', 'CearDragon') + '\n'
        + '<script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>\n'
        + '</div>'
        + content.slice(facebookPanel.end);
    }
  }
  content = content
    .replace(
      /<div class="sliderprev"><a href="#" id="ui-carousel-prev"><img src="images\/slider-arrow-left\.png" alt="" border="0" \/><\/a><\/div>/i,
      '<button class="slider-control slider-control--previous" type="button" aria-label="Previous screenshots"><img src="images/slider-arrow-left.png" alt="" /></button>',
    )
    .replace(
      /<div class="slidernext"><a href="#" id="ui-carousel-next"><img src="images\/slider-arrow-right\.png" alt="" border="0" \/><\/a><\/div>/i,
      '<button class="slider-control slider-control--next" type="button" aria-label="Next screenshots"><img src="images/slider-arrow-right.png" alt="" /></button>',
    );
  if (!isAbout && languageSuffix) content = content.replace(/href="about\.html"/g, `href="${aboutPage}"`);
  const languageMenu = findDivRange(content, 'lang_menu');
  if (languageMenu) {
    const disclosure = content.slice(languageMenu.start, languageMenu.end)
      .replace('<div class="lang_menu">', '<details class="lang_menu">')
      .replace(/<a class="language">([^<]+)<\/a>/i, '<summary>$1</summary>')
      .replace(/<\/div>$/i, '</details>');
    content = content.slice(0, languageMenu.start) + disclosure + content.slice(languageMenu.end);
  }
  content = content.replace(/<html\b[^>]*>/i, `<html lang="${suffix === 'jp' ? 'ja' : suffix ?? 'en'}">`);
  if (!/name=["']viewport["']/i.test(content)) {
    content = content.replace(/<meta[^>]+charset[^>]*>/i, '$&\n<meta name="viewport" content="width=device-width, initial-scale=1">');
  }
  content = content.replace(/<\/head>/i, '<link rel="stylesheet" href="../era-selector.css">\n</head>');
  content = content.replace(/<body\b[^>]*>/i, (bodyTag) => `${bodyTag}\n${eraNavigation()}`);
  if (!isAbout) content = content.replace(/<\/body>/i, '<script type="module" src="gallery.js" defer></script>\n</body>');
  return content;
}

function eraNavigation() {
  return '<nav class="era-selector" aria-label="Choose a time period"><span class="era-selector__prompt">When are we?</span><ol><li><a href="../index.html">the beginning</a></li><li><span aria-current="page">the middle</span></li><li><a href="../end/index.html">the end</a></li></ol></nav>';
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) {
  await cp(join(root, file), join(output, file), { recursive: true });
}
await cp(join(root, 'images', 'discord.svg'), join(output, 'middle', 'images', 'discord.svg'));
await cp(join(root, 'images', 'x.svg'), join(output, 'middle', 'images', 'x.svg'));
for (const file of await readdir(join(output, 'middle'))) {
  if (!file.endsWith('.html')) continue;
  const page = join(output, 'middle', file);
  await writeFile(page, restoreArchivePage(await readFile(page, 'utf8'), file));
}
console.log('Static site built in dist/');