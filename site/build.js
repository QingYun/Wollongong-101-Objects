var webpack = require("webpack"),
    chalk = require("chalk"),
    Mustache = require("mustache"),
    fs = require("fs"),
    webpack_config = require("./webpack.config.js");

var compiler = webpack(webpack_config);

function onFinish(err, stats) {
  if(err)
    return handleFatalError(err);
  var jsonStats = stats.toJson();
  if(jsonStats.errors.length > 0)
    return handleSoftErrors(jsonStats.errors);
  if(jsonStats.warnings.length > 0)
    handleWarnings(jsonStats.warnings);
  buildTemplate();
}

function handleWarnings(warnings) {
  warnings.forEach(function (warning) {
    console.log(chalk.yellow(warning));
  });
  console.log("\n");
}

function handleSoftErrors(jsonStats, errors) {
  console.log(chalk.red(jsonStats.toString()));
  if (errors) {
    errors.forEach(function (err) {
      console.log(chalk.red(err));
    });
  }
  console.log("\n");
}

function handleFatalError(err) {
  console.log(chalk.bgRed(err) + "\n");
}

function buildTemplate() {
  fs.readFile("./src/templates/root.mustache", function (err, template) {
    if (err) return console.log(chalk.bgRed(err));

    fs.readFile("./built/js/bundle.js", function (err, bundle_js) {
      var result_html = Mustache.render(template.toString("utf8"), {
        prerendered_html: "<h1>Hello World</h1>",
        bundle_js: bundle_js
      });

      fs.writeFile("./built/index.html", result_html, function (err) {
        if (err) return console.log(chalk.bgRed(err));
      });
    })

  });
}

if (process.env.WEBPACK_WATCH !== undefined) {
  compiler.watch({
    aggregateTimeout: 300,
    poll: true
  }, onFinish);
} else {
  console.log(chalk.blue("building site..."));
  compiler.run(onFinish);
}
