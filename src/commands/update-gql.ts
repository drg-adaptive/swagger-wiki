import { Command, flags } from "@oclif/command";
import axios from "axios";
import * as path from "path";
import * as Listr from "listr";
import * as fs from "fs";
import * as execa from "execa";
import { UpdateTasks, Context } from "../update-tasks";

const gqlmd = require("graphql-markdown");

export default class UpdateGql extends Command {
  static description = "Generate wiki pages from graphql files";

  static flags = {
    help: flags.help({ char: "h" }),
    token: flags.string({ description: "GitLab private token to use" }),
    project: flags.string({
      description: "GitLab project ID",
      env: "CI_PROJECT_ID"
    })
  };

  static args = [{ name: "path", description: "Path to the graphql files" }];

  async run() {
    const { args, flags } = this.parse(UpdateGql);

    const api = axios.create({
      baseURL: `https://gitlab.com/api/v4/projects/${flags.project}/`,
      headers: { "Private-Token": flags.token }
    });

    const tasks = UpdateTasks(
      {
        title: "Convert GraphQL to MD",
        task(ctx: Context) {
          ctx.files = fs
            .readdirSync(ctx.rootDir)
            .filter((x: string) => x.toLowerCase().endsWith("graphql"))
            .map((x: string) => path.join(ctx.rootDir, x));

          return new Listr(
            ctx.files.map((filename: string) => ({
              title: filename,
              async task() {
                const schema = await gqlmd.loadSchemaJSON(filename);

                const lines: Array<string> = [];

                await gqlmd.renderSchema(schema, {
                  printer: (line: string) => lines.push(line)
                });

                fs.writeFileSync(
                  filename.replace(".graphql", ".md"),
                  lines.join("\n"),
                  { encoding: "utf-8" }
                );
              }
            })),
            { concurrent: true }
          );
        }
      },
      (ctx: Context, slug: string) => {
        let prefix;
        try {
          const source = fs.readFileSync(
            path.join(process.cwd(), `package.json`),
            "utf-8"
          );
          const { version } = JSON.parse(source);

          if (version) {
            prefix = version;
          }
        } catch (ex) {
          console.error(ex);
        }

        return prefix;
      },
      (source: string) => source.replace(".graphql", ".md")
    );

    await tasks.run({
      api,
      rootDir: path.resolve(args.path)
    });
  }
}
