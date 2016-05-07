import slug from 'slug';
import objectAssign from 'object-assign';

import template from '../templates/index.mustache';

function showElm(elm) {
  elm.classList.remove('hidden');
}

function hideElm(elm) {
  elm.classList.add('hidden');
}

function activate(elm) {
  elm.classList.add('active');
}

function deactivate(elm) {
  elm.classList.remove('active');
}

function isActive(elm) {
  return elm.classList.contains('active');
}

function handleBtnClick({ self, selfBox, other, otherBox }) {
  return e => {
    if (isActive(self)) {
      deactivate(self);
      hideElm(selfBox);

      activate(other);
      showElm(otherBox);
    } else {
      activate(self);
      showElm(selfBox);

      deactivate(other);
      hideElm(otherBox);
    }
    e.preventDefault();
  };
}

function handleSectionHeaderClick(sections, selfIndex) {
  return e => {
    const self = sections.item(selfIndex);
    if (isActive(self)) {
      deactivate(self);
    } else {
      for (let i = 0; i < sections.length; i++) {
        deactivate(sections.item(i));
      }
      activate(self);
    }
    e.preventDefault();
    return true;
  };
}

function attachThemeBoxActions(elm) {
  const sections = elm.querySelectorAll('section');
  for (let i = 0; i < sections.length; i++) {
    const section = sections.item(i);
    section.classList.remove('active');
    const header = section.querySelector('header');
    header.addEventListener('click', handleSectionHeaderClick(sections, i));
  }
}

function toPairs(obj) {
  const arr = [];
  Object.keys(obj).forEach(k => arr.push([k, obj[k]]));
  return arr;
}

function attachByThemeEvents(rootElm) {
  const [byThemeBtn, byIndexBtn] = [
    rootElm.querySelector('.index-box .sort-control .by-theme'),
    rootElm.querySelector('.index-box .sort-control .by-index'),
  ];

  const [byThemeBox, byIndexBox] = [
    rootElm.querySelector('.index-box .box.theme'),
    rootElm.querySelector('.index-box .box.all'),
  ];

  byThemeBtn.addEventListener('click', handleBtnClick({
    self: byThemeBtn,
    selfBox: byThemeBox,
    other: byIndexBtn,
    otherBox: byIndexBox,
  }));

  byIndexBtn.addEventListener('click', handleBtnClick({
    self: byIndexBtn,
    selfBox: byIndexBox,
    other: byThemeBtn,
    otherBox: byThemeBox,
  }));

  attachThemeBoxActions(byThemeBox);
}

function renderByTheme(data) {
  const byTheme =
    toPairs(data.objects.reduce((tags, obj) => (
      obj.tags.reduce((tagsInObj, tag) => {
        const [img] = obj.attachments
          .filter((attachment) => attachment.type === 'image');

        const pageUrl = `/${slug(obj.name)}.html?index=${obj.index}`;

        return objectAssign(tagsInObj, {
          [tag]: (tagsInObj[tag] || []).concat({
            name: obj.name,
            pageUrl,
            imgUrl: img ? img.key : '',
          }),
        });
      }, tags)
    ), {}))
    .map((pair) => ({
      tag: pair[0],
      objects: pair[1],
    }));

  return [template({ byTheme }), attachByThemeEvents];
}

function renderByIndex(data) {
  const byIndex = data.objects
    .map((obj) => {
      const url = `/${slug(obj.name)}.html?index=${obj.index}`;
      return {
        name: obj.name,
        index: obj.index,
        url,
      };
    })
    .sort((a, b) => a.index - b.index);

  return [template({ byIndex }), () => {}];
}

export function render(data, { section }) {
  return (section === 'by theme' ? renderByTheme : renderByIndex)(data);
}
