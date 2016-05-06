import Aviator from "aviator";

import "./stylesheets/app.scss";
import data from "../asset/data.json";
import * as IndexPage from "./pages/index.js";
import * as ObjectPage from "./pages/object.js";

document.addEventListener("DOMContentLoaded", () => {
  const render_target = document.getElementById("render-target");
  const routing_target = {
    toIndex: (req) => {
      Aviator.navigate("/index.html");
    },

    showIndex: (req) => {
      render_target.innerHTML = IndexPage.renderTemplate(data);
      IndexPage.attachEvents(render_target);
    },

    showObject: (req) => {
      const obj_index = parseInt(req.params.index, 10);
      if (isNaN(obj_index)) return Aviator.navigate("/index.html");
      render_target.innerHTML = ObjectPage.renderTemplate(data, obj_index);
      ObjectPage.attachEvents(render_target);
    }
  }

  Aviator.setRoutes({
    target: routing_target,
    "/": "toIndex",
    "/index.html": "showIndex",
    notFound: "showObject"
  });

  Aviator._navigator.onClick = function (e) {
    let target = e.target,
        matchesSelector = this._matchesSelector(target);

    if (e.metaKey || e.ctrlKey) return;

    while (target) {
      if (this._matchesSelector(target)) {
        break;
      }

      target = target.parentNode;
    }

    if (!target) return;

    e.preventDefault();

    let pathname = target.pathname;

    if (pathname.charAt(0) !== '/') pathname = '/' + pathname;

    let uri = pathname.replace(this.root, '');

    let options = {};
    if (target.search !== "")
      options.queryParams = target.search
        .replace(/(^\?)/,'')
        .split("&")
        .reduce((acc, pair_str) => {
          let pair = pair_str.split("=");
          acc[pair[0]] = pair[1];
          return acc
        }, {});

    this.navigate(uri, options);
  }

  Aviator.dispatch();
});
