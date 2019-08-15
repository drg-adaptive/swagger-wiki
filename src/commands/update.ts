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
    })
  };

  static args = [{ name: "path", description: "Path to the swagger files" }];

  async run() {
    const { args, flags } = this.parse(Update);

    const api = axios.create({
      baseURL: `https://gitlab.com/api/v4/projects/${flags.project}/`,
      headers: { "Private-Token": flags.token }
    });

    await UpdateTasks.run({
      api,
      rootDir: path.resolve(args.path)
    });
  }
}
