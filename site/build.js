import chalk from "chalk";
import slug from "slug";
import Mustache from "mustache";
import _ from "lodash";
import fs from "fs";
import path from "path";
import {minify} from "html-minifier";
import {argv} from "optimist";

import data from "./asset/data.json";

function compileIndex(compile, data) {
  fs.readFile("./src/templates/index.mustache", function (err, template) {
    if (err) return console.log(chalk.bgRed(err));

    var by_tag = _.chain(data.objects)
      .reduce(function (acc, obj) {
        return obj.tags.reduce(function (acc, tag) {
          var img = obj.attachments.filter(function (attachment) {
            return attachment.type === "image";
          })[0];

          acc[tag] = (acc[tag] || []).concat({
            name: obj.name,
            page_url: slug(obj.name),
            img_url: img? img.key : ""
          });
          return acc;
        }, acc);
      }, {})
      .toPairs()
      .map(function (pair) {
        return {
          tag: pair[0],
          objects: pair[1]
        }
      })
      .value();

    var by_index = _.chain(data.objects)
      .map(function (obj) {
        return {
          name: obj.name,
          index: obj.index,
          url: slug(obj.name)
        };
      })
      .sortBy("index")
      .value();

    compile("index.html", template, {
      by_theme: by_tag,
      by_index: by_index
    });
  });
}

function compileObjectPages(compile, data) {
  var link_template = "<a href={{target}}>{{text}}</a>";
  Mustache.parse(link_template);

  fs.readFile("./src/templates/object.mustache", function (err, template) {
    if (err) return console.log(chalk.bgRed(err));

    var obj_list = _.chain(data.objects)
      .map(function (obj) {
        return {
          url: slug(obj.name),
          index: obj.index,
          name: obj.name
        }
      })
      .sortBy("index")
      .value();

    data.objects.forEach(function (obj) {
      var img = obj.attachments.filter(function (attachment) {
        return attachment.type === "image";
      })[0];

      var description = _.chain(obj.description)
        .filter(function (desc) {
          return desc.type === "paragraph";
        })
        .map(function (p) {
          var content = p.content.reduce(function (acc, c) {
            if (c.type === "text") {
              return acc + c.content;
            } else if (c.type === "hyperlink") {
              var link_html = Mustache.render(link_template, c.content);
              return acc + link_html;
            } else {
              return acc;
            }
          }, "");
          return {paragraph: content};
        })
        .value();

      compile(slug(obj.name) + ".html", template, {
        name: obj.name,
        author: obj.author,
        img_url: img? img.key : "",
        description: description,
        objects: obj_list
      });
    });
  });
}

function compileToHTML(template, bundle_js) {
  return function (file, sub_template, view) {
    var sub_html = Mustache.render(sub_template.toString("utf8"),
                                   view);

    var result_html = Mustache.render(template.toString("utf8"), {
      prerendered_html: sub_html,
      bundle_js: bundle_js
    });

    var minified = minify(result_html, {
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true
    });

    fs.writeFile(path.join("./built", file), minified, function (err) {
      if (err) return console.log(chalk.bgRed(err));
    });
  }
}

function compileTemplates() {
  fs.readFile("./src/templates/root.mustache", function (err, template) {
    if (err) return console.log(chalk.bgRed(err));

    fs.readFile("./built/js/bundle.js", function (err, bundle_js) {
      if (err) return console.log(chalk.bgRed(err));

      console.log(chalk.blue("compiling templates"));
      var compile = compileToHTML(template, bundle_js);
      compileIndex(compile, data);
      compileObjectPages(compile, data);
    })
  });
}

compileTemplates();
