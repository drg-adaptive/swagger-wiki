import { Command, flags } from "@oclif/command";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";

require("dotenv").config();

import { UpdateTasks } from "../update-tasks";

export default class Update extends Command {
  static description = "Generate wiki pages from swagger files";

  static flags = {
    help: flags.help({ char: "h" }),
    token: flags.string({ description: "GitLab private token to use" }),
    project: flags.string({
      description: "GitLab project ID",
      env: "CI_PROJECT_ID"
    }),
    package: flags.string({
      description: "Path to npm package.json file",
      default: path.resolve("./package.json")
    }),
    prefix: flags.string({
      description: "Slug prefix for generated pages"
    })
  };

  static args = [{ name: "path", description: "Path to the swagger files" }];

  async run() {
    const { args, flags } = this.parse(Update);

    let prefix;

    if (fs.existsSync(flags.package)) {
      const content = fs.readFileSync(flags.package, { encoding: "utf-8" });
      const { version } = JSON.parse(content);
      prefix = version;
    }

    if (flags.prefix) {
      prefix = flags.prefix;
    }

    const api = axios.create({
      baseURL: `https://gitlab.com/api/v4/projects/${flags.project}/`,
      headers: { "Private-Token": flags.token }
    });

    await UpdateTasks.run({
      api,
      rootDir: path.resolve(args.path),
      prefix
    });
  }
}
