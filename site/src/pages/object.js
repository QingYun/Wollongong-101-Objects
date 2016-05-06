import slug from "slug";

import template from "../templates/object.mustache";

function renderAnchor(view) {
  return `<a href=${view.target}>${view.text}</a>`
}

export function attachEvents(root_elm) {

}

export function renderTemplate(data, obj_index) {
  const obj = data.objects
    .find((obj) => obj.index === obj_index);

  const obj_list = data.objects
    .map((obj) => {
      const url = `/${slug(obj.name)}.html?index=${obj.index}`;
      return {
        index: obj.index,
        name: obj.name,
        url
      }
    })
    .sort((a, b) => a.index - b.index);

  const [img] = obj.attachments
    .filter((attachment) => attachment.type === "image");

  const description = obj.description
    .filter((desc) => desc.type === "paragraph")
    .map((p) => {
      const content = p.content.reduce((acc, c) => {
        if (c.type === "text") {
          return acc + c.content;
        } else if (c.type === "hyperlink") {
          return acc + renderAnchor(c.content);
        } else {
          return acc;
        }
      }, "");
      return {paragraph: content};
    });

  return template({
    name: obj.name,
    author: obj.author,
    description: description,
    objects: obj_list,
    img: {
      url: img? img.key : "",
      height: img? img.height : 0,
      width: img? img.width : 0
    }
  });
}
