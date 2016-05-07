import slug from 'slug';

import template from '../templates/object.mustache';

function renderAnchor(view) {
  return `<a href=${view.target}>${view.text}</a>`;
}

export function attachEvents(rootElm) {
  return rootElm;
}

export function renderTemplate(data, objIndex) {
  const obj = data.objects
    .find((o) => o.index === objIndex);

  const objList = data.objects
    .map((o) => {
      const url = `/${slug(o.name)}.html?index=${o.index}`;
      return {
        index: o.index,
        name: o.name,
        url,
      };
    })
    .sort((a, b) => a.index - b.index);

  const [img] = obj.attachments
    .filter((attachment) => attachment.type === 'image');

  const description = obj.description
    .filter((desc) => desc.type === 'paragraph')
    .map((p) => {
      const content = p.content.reduce((acc, c) => {
        if (c.type === 'text') {
          return acc + c.content;
        } else if (c.type === 'hyperlink') {
          return acc + renderAnchor(c.content);
        }
        return acc;
      }, '');
      return { paragraph: content };
    });

  return template({
    name: obj.name,
    author: obj.author,
    description,
    objects: objList,
    img: {
      url: img ? img.key : '',
      height: img ? img.height : 0,
      width: img ? img.width : 0,
    },
  });
}
