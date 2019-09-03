import { Command, flags } from "@oclif/command";
import axios from "axios";
import * as execa from "execa";
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as Listr from "listr";
import * as path from "path";

require("dotenv").config();

import { UpdateTasks, Context } from "../update-tasks";

export default class Update extends Command {
  static description = "Generate wiki pages from swagger files";

  static flags = {
    help: flags.help({ char: "h" }),
    token: flags.string({ description: "GitLab private token to use" }),
    usePackageVersion: flags.boolean({
      description: "Use the version in package.json",
      char: "v"
    }),
    project: flags.string({
      description: "GitLab project ID",
      env: "CI_PROJECT_ID"
    })
  };

  static args = [{ name: "path", description: "Path to the swagger files" }];

  async run() {
    const { args, flags } = this.parse(Update);

    const api = axios.create({
      baseURL: `https://gitlab.com/api/v4/projects/${flags.project}/`,
      headers: { "Private-Token": flags.token }
    });

    const tasks = UpdateTasks(
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
              task: () => {
                return execa(
                  "./node_modules/.bin/swagger-markdown",
                  ["--skip-info", "-i", filename],
                  {
                    cwd: process.cwd(),
                    shell: false,
                    stdio: "inherit"
                  }
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
          if (flags.usePackageVersion) {
            const packageSource = fs.readFileSync(
              path.resolve("./package.json"),
              "utf-8"
            );

            const { version } = JSON.parse(packageSource);
            prefix = version;
          } else {
            const source = fs.readFileSync(
              path.join(ctx.rootDir, `${slug}.yaml`),
              "utf-8"
            );
            const { info } = yaml.safeLoad(source);

            if (info && info.version) {
              prefix = info.version;
            }
          }
        } catch (ex) {
          console.error(ex);
        }

        return prefix;
      },
      (source: string) => source.replace(".yaml", ".md").replace(".yml", ".md")
    );

    await tasks.run({
      api,
      rootDir: path.resolve(args.path)
    });
  }
}
