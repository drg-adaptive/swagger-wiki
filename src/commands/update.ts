import { Command, flags } from "@oclif/command";
import axios from "axios";
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as Listr from "listr";
import * as path from "path";
import * as Observable from "zen-observable";

const transformPath = require("swagger-markdown/app/transformers/path");
const transformSecurityDefinitions = require("swagger-markdown/app/transformers/securityDefinitions");
const transformExternalDocs = require("swagger-markdown/app/transformers/externalDocs");
const transformDefinition = require("swagger-markdown/app/transformers/definitions");

require("dotenv").config();

import { Context, UpdateTasks } from "../update-tasks";

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
            ctx.files.map(
              (filename: string) =>
                ({
                  title: filename,
                  task: () =>
                    new Observable(observer => {
                      const document = [];

                      const error = (message: string) => {
                        if (observer && observer.error) {
                          observer.error(message);
                        } else {
                          console.error(message);
                        }
                      };

                      const log = (message: string) => {
                        if (observer && observer.next) {
                          observer.next(message);
                        } else {
                          console.error(message);
                        }
                      };

                      try {
                        log("Reading source");
                        const inputDoc = yaml.safeLoad(
                          fs.readFileSync(filename, "utf8")
                        );
                        const outputFile = filename.replace(
                          /(yaml|yml|json)$/i,
                          "md"
                        );

                        // Collect parameters
                        const parameters =
                          "parameters" in inputDoc ? inputDoc.parameters : {};

                        if ("externalDocs" in inputDoc) {
                          log("External documents");

                          document.push(
                            transformExternalDocs(inputDoc.externalDocs)
                          );
                        }

                        // Security definitions
                        if ("securityDefinitions" in inputDoc) {
                          log("Security definitions");
                          document.push(
                            transformSecurityDefinitions(
                              inputDoc.securityDefinitions
                            )
                          );
                        } else if (
                          inputDoc.components &&
                          inputDoc.components.securitySchemas
                        ) {
                          log("Security schemas");
                          document.push(
                            transformSecurityDefinitions(
                              inputDoc.components.securityDefinitions
                            )
                          );
                        }

                        // Process Paths
                        if ("paths" in inputDoc) {
                          log("Processing paths");
                          Object.keys(inputDoc.paths).forEach(path =>
                            document.push(
                              transformPath(
                                path,
                                inputDoc.paths[path],
                                parameters
                              )
                            )
                          );
                        }

                        // Models (definitions)
                        if ("definitions" in inputDoc) {
                          log("Definitions");
                          document.push(
                            transformDefinition(inputDoc.definitions)
                          );
                        } else if (
                          inputDoc.components &&
                          inputDoc.components.schemas
                        ) {
                          log("Schemas");
                          document.push(
                            transformDefinition(inputDoc.components.schemas)
                          );
                        }

                        log("Saving markdown");
                        fs.writeFile(outputFile, document.join("\n"), err => {
                          if (err) {
                            error(err.message);
                          }
                        });
                      } catch (e) {
                        error(e.message);
                      } finally {
                        observer.complete();
                      }
                    })
                } as any)
            ),
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
