import template from "../templates/object.mustache";

export function attachEvents(root_elm) {

}

export function renderTemplate(data, obj_index) {
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

  return template({
    name: obj.name,
    author: obj.author,
    img_url: img? img.key : "",
    description: description,
    objects: obj_list
  });
}
