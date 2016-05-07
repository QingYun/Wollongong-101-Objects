import chalk from 'chalk';
import slug from 'slug';
import Mustache from 'mustache';
import fs from 'fs';
import path from 'path';
import { minify } from 'html-minifier';

import dataSource from './asset/data.json';
import * as ObjectPage from './src/pages/object.js';
import * as IndexPage from './src/pages/index.js';

function compileIndex(compile, data) {
  compile('index.html', IndexPage.renderTemplate(data));
  console.log(chalk.blue('index finished'));
}

function compileObjectPages(compile, data) {
  data.objects.forEach((obj, i) => {
    compile(`${slug(obj.name)}.html`,
            ObjectPage.renderTemplate(data, obj.index));
    console.log(chalk.blue(`${i}. ${obj.name} finished`));
  });
}

function compileToHTML(template, bundleJs, styleCss) {
  return (file, subTemplate, view) => {
    const subHtml = Mustache.render(subTemplate.toString('utf8'), view);

    const resultHtml = Mustache.render(template.toString('utf8'), {
      subHtml,
      bundleJs,
      styleCss,
    });

    let minified = '';
    try {
      minified = minify(resultHtml, {
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
      });
    } catch (e) {
      console.log(
        chalk.bgRed(`Got an error when trying to minify the rendered template:
                    ${e}`));
    }

    fs.writeFile(path.join('./built', file), minified, (err) => {
      if (err) return console.log(chalk.bgRed(err));
      return true;
    });
  };
}

function compileTemplates() {
  fs.readFile('./src/templates/root.mustache', (readRootErr, template) => {
    if (readRootErr) return console.log(chalk.bgRed(readRootErr));

    fs.readFile('./built/bundle.js', (readBundleErr, bundleJs) => {
      if (readBundleErr) return console.log(chalk.bgRed(readBundleErr));

      fs.readFile('./built/style.css', (readStyleErr, styleCss) => {
        if (readStyleErr) return console.log(chalk.bgRed(readStyleErr));

        console.log(chalk.blue('compiling templates'));
        const compile = compileToHTML(template, bundleJs, styleCss);
        compileIndex(compile, dataSource);
        compileObjectPages(compile, dataSource);
        return true;
      });
      return true;
    });
    return true;
  });
}

compileTemplates();
