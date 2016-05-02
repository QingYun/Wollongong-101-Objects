function showElm(elm) {
  elm.classList.remove("hidden");
}

function hideElm(elm) {
  elm.classList.add("hidden");
}

function activate(elm) {
  elm.classList.add("active");
}

function deactivate(elm) {
  elm.classList.remove("active");
}

function isActive(elm) {
  return elm.classList.contains("active");
}

function isVisible(elm) {
  return !elm.classList.contains("hidden");
}

function handleBtnClick({self, self_box, other, other_box}) {
  return e => {
    if (isActive(self)) {

      deactivate(self);
      hideElm(self_box);

      activate(other);
      showElm(other_box);
    } else {
      activate(self);
      showElm(self_box);

      deactivate(other);
      hideElm(other_box);
    }
    e.preventDefault();
  };
}

function handleSectionHeaderClick(sections, self_index) {
  return e => {
    let self = sections.item(self_index);
    if (isActive(self)) {
      deactivate(self);
    } else {
      for (var i = 0; i < sections.length; i++) {
        deactivate(sections.item(i));
      }
      activate(self);
    }
  };
}

function attachThemeBoxActions(elm) {
  let sections = elm.querySelectorAll("section");
  for (var i = 0; i < sections.length; i++) {
    let section = sections.item(i);
    let header = section.querySelector("header");
    header.addEventListener("click", handleSectionHeaderClick(sections, i));
  }
}

export default function indexPage() {
  document.addEventListener("DOMContentLoaded", event => {
    let page_root = document.getElementById("index-page");

    let [by_theme_btn, by_index_btn] = [
      page_root.querySelector(".index-box .sort-control .by-theme"),
      page_root.querySelector(".index-box .sort-control .by-index")
    ];

    let [by_theme_box, by_index_box] = [
      page_root.querySelector(".index-box .box.theme"),
      page_root.querySelector(".index-box .box.all")
    ];

    by_theme_btn.addEventListener("click", handleBtnClick({
      self: by_theme_btn,
      self_box: by_theme_box,
      other: by_index_btn,
      other_box: by_index_box
    }));

    by_index_btn.addEventListener("click", handleBtnClick({
      self: by_index_btn,
      self_box: by_index_box,
      other: by_theme_btn,
      other_box: by_theme_box
    }));

    attachThemeBoxActions(by_theme_box);
  });
}
