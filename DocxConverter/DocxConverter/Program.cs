using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Security.Cryptography;
using System.IO;
using System.Drawing;

namespace DocxConverter
{
  class Program
  {
    static string getImageHash(Image img)
    {
      var md5Hasher = MD5.Create();
      var ms = new MemoryStream();
      img.Save(ms, img.RawFormat);
      var data = md5Hasher.ComputeHash(ms.ToArray());
      var sb = new StringBuilder();
      for (int i = 0; i < data.Length; i++)
      {
        sb.Append(data[i].ToString("x2"));
      }
      return sb.ToString();
    }

    static IEnumerable<Tuple<string, WordprocessingDocument>> getDocs(string dir)
    {
      var asset_folder = Path.Combine(dir, "asset");
      Directory.CreateDirectory(asset_folder);
      var img_folder = Path.Combine(asset_folder, "img");
      Directory.CreateDirectory(img_folder);
      foreach (var file in Directory.GetFiles(dir))
      {
        yield return Tuple.Create(
          file,
          WordprocessingDocument.Open(file, false));
      }
      yield break;
    }

    static JArray parseParagraph(Paragraph p, IEnumerable<HyperlinkRelationship> hyperlinks)
    {
      var text_elms = new string[]{ "r", "hyperlink" };

      var items = p.ChildElements
        .Where(elm => text_elms.Contains(elm.LocalName))
        .Aggregate(new List<object>(),
          (acc, cur) =>
          {
            var last = acc.LastOrDefault();
            if (cur.LocalName == "r")
            {
              if (last is string)
              {
                acc[acc.Count - 1] = last + cur.InnerText;
              }
              else
              {
                acc.Add(cur.InnerText);
              }
            }
            else if (cur.LocalName == "hyperlink")
            {
              acc.Add(new
              {
                text = cur.InnerText,
                target = hyperlinks.Where(h => h.Id.Equals(((Hyperlink)cur).Id)).First().Uri.AbsoluteUri
              });
            }
            return acc;
          })
        .Select(item => {
          if (item is string)
          {
            return new
            {
              type = "text",
              content = item
            };
          }
          else
          {
            return new {
              type = "hyperlink",
              content = item
            };
          }
        });

      if (items.Count() == 1 && items.Last().type == "text")
      {
        var v = (string)items.Last().content;
        if (v.Trim().Length == 0)
        {
          return null;
        }
      }

      return items.Aggregate(new JArray(), (arr, item) => {
          arr.Add(JObject.FromObject(item));
          return arr;
        });
    }

    static List<JArray> takeParagraphStartWith(ref List<JArray> paragraphs, string to_search)
    {
      var targets = paragraphs.Where(
        p => p.Count == 1
              && p.First.Value<string>("type") == "text"
              && p.First.Value<string>("content").StartsWith(to_search, StringComparison.CurrentCultureIgnoreCase));
      paragraphs.Except(targets);
      return targets.ToList(); /*.First.Value<string>("content");*/
    }

    static R protectOn<R>(string file, string part, Func<R> getDefault, Func<R> action)
    {
      try
      {
        return action();
      }
      catch (Exception e)
      {
        Console.WriteLine("Got some problems with [{0}] in file [{1}]: {2}", part, file, e.Message);
        return getDefault();
      }
    }

    static JObject parseDoc(Tuple<string, WordprocessingDocument> pair)
    {
      var file = pair.Item1;
      var doc = pair.Item2;
      var file_name = Path.GetFileName(file);
      var file_path = Path.GetDirectoryName(file);
      var main_part = doc.MainDocumentPart;

      var paragraphs = protectOn(file_name, "description", () => new List<JArray>(),
        () =>
        {
          var hyperlinks = main_part.HyperlinkRelationships;
          return main_part.Document.Body.OfType<Paragraph>()
            // remove empty lines
            .Where(p => p.HasChildren == true || p.InnerText.Length != 0)
            .Select(p => parseParagraph(p, hyperlinks))
            // remove image-only/lang paragraphs
            .Where(p => p != null && p.Count != 0)
            .ToList();
        });

      var tags = protectOn(file_name, "tag", () => new string[] { },
        () =>
        {
          return takeParagraphStartWith(ref paragraphs, "tag:")
            // take content & remove initial "tag:"
            .Select(p => p.First.Value<string>("content").Substring(4))
            .Select(w => w.Trim().ToUpper())
            .Where(w => w != "");
        });

      var name = protectOn(file_name, "name", () => "",
        () =>
        {
          return takeParagraphStartWith(ref paragraphs, "name:")
            .Select(p => p.First.Value<string>("content"))
            .Single()
            // remove "name:"
            .Substring(5)
            .Trim();
        });

      var index = protectOn(file_name, "index", () => 0,
        () =>
        {
          return int.Parse(
            takeParagraphStartWith(ref paragraphs, "index:")
              .Select(p => p.First.Value<string>("content"))
              .Single()
              // remove "index:"
              .Substring(6)
              .Trim());
        });

      var images = protectOn(file_name, "images", () => new JArray(),
        () =>
        {
          var image_parts = main_part.ImageParts;
          var own_folder = Path.Combine(file_path, "asset", "img");
          return image_parts
            .Select(
              img =>
              {
                var img_name = Path.GetFileName(img.Uri.OriginalString);
                var img_obj = Image.FromStream(img.GetStream());
                var img_hash = getImageHash(img_obj);
                var img_path = Path.Combine(own_folder, img_hash);
                img_obj.Save(img_path);
                return new {
                  type = "image",
                  key = img_hash,
                  name = img_name,
                  contentType = img.ContentType,
                  height = img_obj.Height,
                  width = img_obj.Width
                };
              })
            .Aggregate(new JArray(),
              (arr, img) =>
              {
                arr.Add(JObject.FromObject(img));
                return arr;
              });

        });

      var obj = JObject.FromObject(new {
        name = name,
        index = index,
        tags = tags,
        description = paragraphs
          .Aggregate(new JArray(),
            (arr, p) =>
            {
              arr.Add(JObject.FromObject(new
              {
                type = "paragraph",
                content = p
              }));
              return arr;
            }),
        attachments = images
      });

      return obj;
    }

    static JObject formResultJSON(JObject obj, JObject doc)
    {
      obj.Value<JArray>("tags").Merge(doc.Value<JArray>("tags"),
        new JsonMergeSettings
        {
          MergeArrayHandling = MergeArrayHandling.Union
        });

      obj.Value<JArray>("objects").Add(doc);

      return obj;
    }

    static void compileDirectory(string dir)
    {
      var result_json = getDocs(dir)
        .Select(pair => parseDoc(pair))
        .Aggregate(
          JObject.FromObject(new
          {
            tags = new JArray(),
            objects = new JArray()
          }), formResultJSON);

      using (var fs = File.Open(Path.Combine(dir, "asset", "data.json"), System.IO.FileMode.OpenOrCreate))
      using (var sw = new StreamWriter(fs))
      using (var jw = new JsonTextWriter(sw))
      {
        jw.Formatting = Formatting.Indented;
        var serializer = new JsonSerializer();
        serializer.Serialize(jw, result_json);
      }
    }

    static void Main(string[] args)
    {
      compileDirectory(args[0]);

      Console.WriteLine("Press enter to close...");
      Console.ReadLine();
    }
  }
}
