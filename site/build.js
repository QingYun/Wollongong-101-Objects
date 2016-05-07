import chalk from 'chalk';
import slug from 'slug';
import fs from 'fs';
import path from 'path';

import dataSource from './asset/data.json';
import rootTemplate from './src/templates/root.mustache';
import * as ObjectPage from './src/pages/object.js';
import * as IndexPage from './src/pages/index.js';

function compileIndex(compile, data) {
  compile('index.html',
          IndexPage.render(data, { section: 'by index' })[0]);
  compile('index-show-all.html',
          IndexPage.render(data, { section: 'by index' })[0]);
  compile('index-by-category.html',
          IndexPage.render(data, { section: 'by theme' })[0]);
  console.log(chalk.blue('index finished'));
}

function compileObjectPages(compile, data) {
  data.objects.forEach((obj, i) => {
    compile(`${slug(obj.name)}.html`,
            ObjectPage.render(data, { objIndex: obj.index })[0]);
    console.log(chalk.blue(`${i}. ${obj.name} finished`));
  });
}

function compileToHTML(rootTempl, bundleJs, styleCss) {
  return (file, subHtml) => {
    const resultHtml = rootTempl({
      subHtml,
      bundleJs,
      styleCss,
    });

    fs.writeFile(path.join('./built', file), resultHtml, (err) => {
      if (err) return console.log(chalk.bgRed(err));
      return true;
    });
  };
}

function compileTemplates() {
  fs.readFile('./built/bundle.js', (readBundleErr, bundleJs) => {
    if (readBundleErr) return console.log(chalk.bgRed(readBundleErr));

    fs.readFile('./built/style.css', (readStyleErr, styleCss) => {
      if (readStyleErr) return console.log(chalk.bgRed(readStyleErr));

      console.log(chalk.blue('compiling templates'));
      const compile = compileToHTML(rootTemplate, bundleJs, styleCss);
      compileIndex(compile, dataSource);
      compileObjectPages(compile, dataSource);
      return true;
    });
    return true;
  });
  return true;
}

compileTemplates();
