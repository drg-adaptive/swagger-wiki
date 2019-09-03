import { AxiosInstance } from "axios";
import * as execa from "execa";
import * as fs from "fs";
import * as Listr from "listr";
import * as path from "path";

interface ExistingPage {
  slug: string;
}
export interface Context {
  api: AxiosInstance;
  rootDir: string;
  existingPages?: Array<ExistingPage>;
  files?: Array<string>;
  slugs?: Array<SlugEntry>;
}

export interface SlugEntry {
  source: string;
  slug: string;
}

export interface ContextFull extends Context {
  existingPages: Array<ExistingPage>;
  files: Array<string>;
  slugs: Array<SlugEntry>;
}

export const UpdateTasks = (
  convertSource: {
    title: string;
    task(ctx: Context): any;
  },
  getSlugPrefix: (ctx: Context, slug: string) => string | undefined,
  getMarkdownPath: (source: string) => string
) =>
  new Listr<Context>([
    {
      title: "Get existing pages",
      async task(ctx: Context) {
        const result = await ctx.api.get("wikis");
        ctx.existingPages = result.data;
      }
    },
    convertSource,
    {
      title: "Add TOCs",
      task(ctx: Context) {
        return execa("./node_modules/.bin/doctoc", [
          ctx.rootDir,
          "--gitlab",
          "--maxlevel",
          "3",
          "--notitle"
        ]);
      }
    },
    {
      title: "Update pages",
      task(ctx: ContextFull) {
        ctx.slugs = ctx.files.map((filename: string) => {
          let slug = filename.substring(filename.lastIndexOf("/") + 1);
          slug = slug.substring(0, slug.lastIndexOf("."));
          const prefix = getSlugPrefix(ctx, slug);
          slug = (prefix ? prefix + "/" : "") + slug;

          return {
            source: filename,
            slug
          };
        });

        return new Listr(
          ctx.slugs.map((slug: SlugEntry) => ({
            title: slug.slug,
            async task() {
              const markdownPath = path.join(getMarkdownPath(slug.source));
              const content = fs.readFileSync(markdownPath, {
                encoding: "utf-8"
              });

              const data = {
                content,
                slug
              };

              if (ctx.existingPages.find(x => x.slug === slug.slug)) {
                return ctx.api.put(
                  `wikis/${encodeURIComponent(slug.slug)}`,
                  data
                );
              }

              return ctx.api.post(
                "wikis",
                `title=${slug.slug}&content=${content}`
              );
            }
          })),
          { concurrent: false }
        );
      }
    }
  ]);
