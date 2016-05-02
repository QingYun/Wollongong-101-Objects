require("./stylesheets/app.scss");
import indexPage from "./pages/index.js";

if (window.location.href.endsWith("index.html")) {
  indexPage();
}
