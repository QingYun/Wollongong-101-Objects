import chalk from "chalk";
import slug from "slug";
import Mustache from "mustache";
import _ from "lodash";
import fs from "fs";
import path from "path";
import {minify} from "html-minifier";
import {argv} from "optimist";

import data from "./asset/data.json";
import * as ObjectPage from "./src/pages/object.js";
import * as IndexPage from "./src/pages/index.js";

function compileIndex(compile, data) {
  compile("index.html", IndexPage.renderTemplate(data));
  console.log(chalk.blue("index finished"));
}

function compileObjectPages(compile, data) {
  data.objects.forEach((obj, i) => {
    compile(`${slug(obj.name)}.html`,
            ObjectPage.renderTemplate(data, obj.index));
    console.log(chalk.blue(`${i}. ${obj.name} finished`));
  });
}

function compileToHTML(template, bundle_js, style_css) {
  return (file, sub_template, view) => {
    const sub_html = Mustache.render(sub_template.toString("utf8"), view);

    const result_html = Mustache.render(template.toString("utf8"), {
      prerendered_html: sub_html,
      bundle_js,
      style_css
    });

    let minified = "";
    try {
      minified = minify(result_html, {
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true
      });
    } catch (e) {
      console.log(
        chalk.bgRed(`Got an error when trying to minify the rendered template:
                    ${e}`));
    }

    fs.writeFile(path.join("./built", file), minified, (err) => {
      if (err) return console.log(chalk.bgRed(err));
    });
  }
}

function compileTemplates() {
  fs.readFile("./src/templates/root.mustache", (err, template) => {
    if (err) return console.log(chalk.bgRed(err));

    fs.readFile("./built/bundle.js", (err, bundle_js) => {
      if (err) return console.log(chalk.bgRed(err));

      fs.readFile("./built/style.css", (err, style_css) => {
        if (err) return console.log(chalk.bgRed(err));

        console.log(chalk.blue("compiling templates"));
        const compile = compileToHTML(template, bundle_js, style_css);
        compileIndex(compile, data);
        compileObjectPages(compile, data);
      });
    })
  });
}

compileTemplates();
