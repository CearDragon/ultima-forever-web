import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');

async function assertShippedImage(reference) {
  assert.match(reference, /^images\/[^?#]+$/, `Expected a local image path, got ${reference}`);
  let current = output;
  for (const segment of reference.split('/')) {
    const entries = await readdir(current);
    assert.ok(entries.includes(segment), `Image asset path has missing or incorrect-case segment: ${reference}`);
    current = join(current, segment);
  }
  assert.ok((await stat(current)).isFile(), `Image asset is not a file: ${reference}`);
}

async function assertShippedReference(fromFile, reference) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) return;
  const path = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!path) return;
  const resolved = normalize(join(dirname(fromFile), path));
  assert.ok(resolved.startsWith(output), `Local reference escapes dist: ${fromFile} -> ${reference}`);
  let current = output;
  for (const segment of resolved.slice(output.length).split(/[\\/]/).filter(Boolean)) {
    const entries = await readdir(current);
    assert.ok(entries.includes(segment), `Missing or incorrect-case local reference: ${fromFile} -> ${reference}`);
    current = join(current, segment);
  }
  assert.ok((await stat(current)).isFile(), `Local reference is not a file: ${fromFile} -> ${reference}`);
}

function imageReferences(content) {
  const activeContent = content.replace(/<!--[\s\S]*?-->/g, '');
  const references = [...activeContent.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => match[1]);
  for (const match of activeContent.matchAll(/url\(\s*(?:'([^']+)'|"([^"]+)"|([^)\s]+))\s*\)/gi)) {
    references.push(match[1] ?? match[2] ?? match[3]);
  }
  return { activeContent, references };
}

test('build creates a deployable static site with local image assets', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
  const entries = await readdir(output);
  assert.deepEqual(entries.sort(), [
    'UltimaPortal_Main.css', 'era-selector.css', 'home-base.css', 'images', 'index.html',
    'end', 'middle', 'ultima_history.css', 'ultima_history.html',
  ].sort());
  for (const page of ['index.html', 'ultima_history.html']) {
    const html = await readFile(join(output, page), 'utf8');
    assert.match(html, /<!DOCTYPE html>/i);
    assert.doesNotMatch(html, /browser-sync-client/i);
    assert.match(html, /When are we\?/);
    assert.match(html, /href="middle\/index\.html"/);
    assert.match(html, /href="end\/index\.html">the end<\/a>/);
    assert.match(html, /aria-current="page">the beginning/);
    assert.doesNotMatch(html, /<button[^>]*disabled[^>]*>the end<\/button>/);
  }
  const beginning = await readFile(join(output, 'index.html'), 'utf8');
  assert.ok(beginning.indexOf('id="UOlink"') < beginning.indexOf('<nav class="era-selector"'));
  assert.ok(beginning.indexOf('<nav class="era-selector"') < beginning.indexOf('<div id="master">'));
  assert.ok((await readdir(join(output, 'images'))).length > 0);

  const files = ['index.html', 'ultima_history.html', 'home-base.css', 'UltimaPortal_Main.css', 'ultima_history.css', 'era-selector.css'];
  for (const file of files) {
    const { activeContent, references } = imageReferences(await readFile(join(output, file), 'utf8'));
    assert.doesNotMatch(activeContent, /https?:\/\/web\.archive\.org/i, `Found a Wayback URL in ${file}`);
    for (const reference of references) await assertShippedImage(reference);
  }

  const middleFiles = await readdir(join(output, 'middle'));
  assert.deepEqual(middleFiles.filter((file) => file.endsWith('.html')).sort(), [
    'about-de.html', 'about-fr.html', 'about-jp.html', 'about-ko.html', 'about-ru.html', 'about.html',
    'index-de.html', 'index-fr.html', 'index-jp.html', 'index-ko.html', 'index-ru.html', 'index.html',
  ].sort());
  for (const page of middleFiles.filter((file) => file.endsWith('.html'))) {
    const html = await readFile(join(output, 'middle', page), 'utf8');
    assert.match(html, /When are we\?/);
    assert.match(html, /href="\.\.\/index\.html"/);
    assert.match(html, /href="\.\.\/end\/index\.html">the end<\/a>/);
    assert.match(html, /aria-current="page">the middle/);
    assert.doesNotMatch(html, /<button[^>]*disabled[^>]*>the end<\/button>/);
    assert.match(html, /<summary>Forums<\/summary>/);
    assert.match(html, /href="#" data-placeholder-link[^>]*>Archive<\/a>/);
    assert.match(html, /href="#" data-placeholder-link[^>]*>Discord<\/a>/);
    assert.match(html, /href="#" data-placeholder-link[^>]*>FAQ<\/a>/);
    assert.match(html, /images\/appbadges\/app_[^"']+\.png/);
    assert.match(html, /https:\/\/apps\.apple\.com\/us\/app\/ultima-forever-quest-for-the-avatar\/id591550134/);
    const youtubeSocialLinks = [...html.matchAll(/<a href="([^"]+)"[^>]*>\s*<img[^>]*icon_social_youtube_(?:large|small)\.png/gi)];
    assert.ok(youtubeSocialLinks.length > 0);
    assert.ok(youtubeSocialLinks.every(([, href]) => href === 'https://www.youtube.com/playlist?list=PLEhw1ePxp4uM'));
    assert.doesNotMatch(html, /web\.archive\.org|google-analytics|platform\.twitter|connect\.facebook|jquery|forums\.ultimaforever/i);
    assert.doesNotMatch(html, /<script\b(?![^>]*src="(?:gallery\.js|https:\/\/platform\.x\.com\/widgets\.js)")/i);
    if (!page.startsWith('about')) {
      assert.match(html, /jMfBczn7pH8/);
      assert.match(html, /<div class="header">Twitter<\/div>[\s\S]*?<a class="twitter-timeline" data-height="360" href="https:\/\/x\.com\/UltimaForever\?ref_src=twsrc%5Etfw">Posts by UltimaForever<\/a>/);
      assert.match(html, /<div class="header">X<\/div>/);
      assert.match(html, /<a class="twitter-timeline" data-height="360" href="https:\/\/x\.com\/CearDragon\?ref_src=twsrc%5Etfw">Posts by CearDragon<\/a>/);
      assert.match(html, /<script async src="https:\/\/platform\.x\.com\/widgets\.js" charset="utf-8"><\/script>/);
      assert.equal([...html.matchAll(/platform\.x\.com\/widgets\.js/g)].length, 1);
      assert.doesNotMatch(html, /syndication\.twitter\.com|<iframe[^>]+community-feed__frame|<div class="header">Facebook<\/div>|class="fb-like-box"|facebook\.com\/plugins\/page\.php/i);
      assert.match(html, /slider-control--previous/);
      assert.match(html, /slider-control--next/);
      assert.match(html, /https:\/\/twitter\.com\/UltimaForever/);
      assert.match(html, /https:\/\/www\.facebook\.com\/UltimaForever/);
    } else {
      assert.doesNotMatch(html, /twitter-timeline|platform\.x\.com\/widgets\.js/);
    }
    for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
      await assertShippedReference(join(output, 'middle', page), match[1]);
    }
  }

  for (const file of ['css/stylesheet.css', 'gallery.js']) {
    const content = await readFile(join(output, 'middle', file), 'utf8');
    assert.doesNotMatch(content, /web\.archive\.org|jquery|google-analytics/i);
    for (const match of content.matchAll(/url\(\s*(?:'([^']+)'|"([^"]+)"|([^\s)]+))\s*\)/gi)) {
      await assertShippedReference(join(output, 'middle', file), match[1] ?? match[2] ?? match[3]);
    }
  }
  assert.ok((await readdir(join(output, 'middle', 'images'))).length > 0);
  assert.ok((await readdir(join(output, 'middle', 'fonts'))).length > 0);

  const endFiles = await readdir(join(output, 'end'));
  assert.deepEqual(endFiles.sort(), ['css', 'images', 'index.html'].sort());
  const endPage = await readFile(join(output, 'end', 'index.html'), 'utf8');
  assert.match(endPage, /When are we\?/);
  assert.match(endPage, /href="\.\.\/index\.html">the beginning<\/a>/);
  assert.match(endPage, /href="\.\.\/middle\/index\.html">the middle<\/a>/);
  assert.match(endPage, /aria-current="page">the end/);
  assert.match(endPage, /As of Aug 29th 2014 \(11:00 AM EDT\)/);
  assert.match(endPage, /we're going to miss you very much/);
  assert.match(endPage, /Strangers, Seekers and Avatars all/);
  assert.match(endPage, /Remember and uphold the Virtues, always/);
  assert.match(endPage, /href="https:\/\/www\.ea\.com\/1\/legal-notices"/);
  assert.match(endPage, /Online Safety Guidelines/);
  assert.match(endPage, /footer_logo_mythic\.png/);
  assert.match(endPage, /footer_logo_ea\.png/);
  assert.doesNotMatch(endPage, /web\.archive\.org|google-analytics|<script\b/i);
  for (const match of endPage.matchAll(/(?:src|href)=['"]([^'"]+)['"]/gi)) {
    await assertShippedReference(join(output, 'end', 'index.html'), match[1]);
  }
  const endStylesheet = await readFile(join(output, 'end', 'css', 'stylesheet.css'), 'utf8');
  assert.doesNotMatch(endStylesheet, /web\.archive\.org/);
  for (const match of endStylesheet.matchAll(/url\(\s*(?:'([^']+)'|"([^"]+)"|([^\s)]+))\s*\)/gi)) {
    await assertShippedReference(join(output, 'end', 'css', 'stylesheet.css'), match[1] ?? match[2] ?? match[3]);
  }
});

test('gallery navigation advances in both directions and wraps at either end', async () => {
  const source = await readFile(join(root, 'middle', 'gallery.js'), 'utf8');
  const gallery = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

  assert.equal(typeof gallery.nextGalleryStart, 'function');
  assert.equal(gallery.nextGalleryStart(0, 1, 10, 6), 4);
  assert.equal(gallery.nextGalleryStart(4, 1, 10, 6), 0);
  assert.equal(gallery.nextGalleryStart(0, -1, 10, 6), 4);
  assert.equal(gallery.nextGalleryStart(4, -1, 10, 6), 0);
  assert.equal(gallery.nextGalleryStart(0, 1, 4, 6), 0);
});