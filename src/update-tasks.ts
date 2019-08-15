import { AxiosInstance } from "axios";
import * as execa from "execa";
import * as fs from "fs";
import * as Listr from "listr";
import * as path from "path";

interface ExistingPage {
  slug: string;
}
interface Context {
  api: AxiosInstance;
  rootDir: string;
  prefix?: string;
}

interface ContextFull extends Context {
  existingPages: Array<ExistingPage>;
  files: Array<string>;
  slugs: Array<string>;
}

export const UpdateTasks = new Listr<Context>([
  {
    title: "Get existing pages",
    async task(ctx: Context) {
      const result = await ctx.api.get("wikis");
      ctx.existingPages = result.data;
    }
  },
  {
    title: "Convert YAML to MD",
    task(ctx: Context) {
      ctx.files = fs
        .readdirSync(ctx.rootDir)
        .filter((x: string) => x.toLowerCase().endsWith("yaml"))
        .map((x: string) => path.join(ctx.rootDir, x));

      return new Listr(
        ctx.files.map((filename: string) => ({
          title: filename,
          task: () =>
            execa("./node_modules/.bin/swagger-markdown", ["-i", filename], {
              cwd: process.cwd(),
              shell: false,
              stdio: "inherit"
            })
        })),
        { concurrent: true }
      );
    }
  },
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
      ctx.slugs = ctx.files.map(
        (filename: string) =>
          (ctx.prefix ? ctx.prefix + "/" : "") +
          filename.substring(filename.lastIndexOf("/") + 1, filename.length - 5)
      );

      return new Listr(
        ctx.slugs.map(slug => ({
          title: slug,
          async task() {
            const markdownPath = path.join(ctx.rootDir, `${slug}.md`);
            const content = fs.readFileSync(markdownPath, {
              encoding: "utf-8"
            });
            const data = {
              content,
              slug
            };

            if (ctx.existingPages.find(x => x.slug === slug)) {
              return ctx.api.put(`wikis/${slug}`, data);
            }

            return ctx.api.post("wikis", `title=${slug}&content=${content}`);
          }
        })),
        { concurrent: false }
      );
    }
  }
]);
