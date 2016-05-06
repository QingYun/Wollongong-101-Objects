import slug from "slug";

import template from "../templates/index.mustache";

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
    const self = sections.item(self_index);
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

function toPairs(obj) {
  let arr = [];
  for (let k in obj) {
    arr.push([k, obj[k]]);
  }
  return arr;
}

export function attachEvents(root_elm) {
  const [by_theme_btn, by_index_btn] = [
    root_elm.querySelector(".index-box .sort-control .by-theme"),
    root_elm.querySelector(".index-box .sort-control .by-index")
  ];

  const [by_theme_box, by_index_box] = [
    root_elm.querySelector(".index-box .box.theme"),
    root_elm.querySelector(".index-box .box.all")
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
}

export function renderTemplate(data) {
  const by_theme =
    toPairs(data.objects.reduce((acc, obj) => {
      return obj.tags.reduce((acc, tag) => {
        const [img] = obj.attachments
          .filter((attachment) => attachment.type === "image");

        const page_url = `/${slug(obj.name)}.html?index=${obj.index}`;

        acc[tag] = (acc[tag] || []).concat({
          name: obj.name,
          page_url,
          img_url: img? img.key : ""
        });
        return acc;
      }, acc);
    }, {}))
    .map((pair) => {
      return {
        tag: pair[0],
        objects: pair[1]
      }
    });

  const by_index = data.objects
    .map((obj) => {
      const url = `/${slug(obj.name)}.html?index=${obj.index}`;
      return {
        name: obj.name,
        index: obj.index,
        url
      };
    })
    .sort((a, b) => a.index - b.index);

  return template({by_theme, by_index});
}
