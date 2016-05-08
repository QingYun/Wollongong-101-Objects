import slug from 'slug';

import template from '../templates/presentation.mustache';

function renderAnchor(view) {
  return `<a href=${view.target} class="link inline">${view.text}</a>`;
}

function attachEventHandlers() {
  document.addEventListener('impress:init', (e) => {
    const api = e.detail.api;
    setInterval(() => api.next(), 60 * 1000);
  });

  require.ensure([], (require) => {
    const impress = require('exports?impress!../vender/impress.js');
    impress().init();
  });
}

export function render(data) {
  const sortedObjects = data.objects;
  sortedObjects.sort((a, b) => a.index - b.index);
  const objects = sortedObjects.map((obj, i) => {
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

    return {
      name: obj.name,
      slide_id: slug(obj.name),
      author: obj.author,
      description,
      img: {
        url: img ? img.key : '',
        height: img ? img.height : 0,
        width: img ? img.width : 0,
      },
      pos: {
        x: i * 2000,
        y: 0,
      },
    };
  });

  return [template({ objects }), attachEventHandlers];
}
