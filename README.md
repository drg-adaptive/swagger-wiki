<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [swagger-wiki](#swagger-wiki)
- [Usage](#usage)
- [Commands](#commands)
    - [`swagger-wiki help [COMMAND]`](#swagger-wiki-help-command)
    - [`swagger-wiki update [PATH]`](#swagger-wiki-update-path)
    - [`swagger-wiki update-gql [PATH]`](#swagger-wiki-update-gql-path)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

swagger-wiki
============

A cli to create wiki pages in a project based on swagger files.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/swagger-wiki.svg)](https://npmjs.org/package/swagger-wiki)
[![Downloads/week](https://img.shields.io/npm/dw/swagger-wiki.svg)](https://npmjs.org/package/swagger-wiki)
[![License](https://img.shields.io/npm/l/swagger-wiki.svg)](https://github.com/theBenForce//blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g swagger-wiki
$ swagger-wiki COMMAND
running command...
$ swagger-wiki (-v|--version|version)
swagger-wiki/1.0.14 darwin-x64 node-v10.16.0
$ swagger-wiki --help [COMMAND]
USAGE
  $ swagger-wiki COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`swagger-wiki help [COMMAND]`](#swagger-wiki-help-command)
* [`swagger-wiki update [PATH]`](#swagger-wiki-update-path)
* [`swagger-wiki update-gql [PATH]`](#swagger-wiki-update-gql-path)

## `swagger-wiki help [COMMAND]`

display help for swagger-wiki

```
USAGE
  $ swagger-wiki help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `swagger-wiki update [PATH]`

Generate wiki pages from swagger files

```
USAGE
  $ swagger-wiki update [PATH]

ARGUMENTS
  PATH  Path to the swagger files

OPTIONS
  -h, --help         show CLI help
  --project=project  GitLab project ID
  --token=token      GitLab private token to use
```

_See code: [src/commands/update.ts](https://github.com/drg-adaptive/swagger-wiki/blob/v1.0.14/src/commands/update.ts)_

## `swagger-wiki update-gql [PATH]`

Generate wiki pages from graphql files

```
USAGE
  $ swagger-wiki update-gql [PATH]

ARGUMENTS
  PATH  Path to the graphql files

OPTIONS
  -h, --help         show CLI help
  --project=project  GitLab project ID
  --token=token      GitLab private token to use
```

_See code: [src/commands/update-gql.ts](https://github.com/drg-adaptive/swagger-wiki/blob/v1.0.14/src/commands/update-gql.ts)_
<!-- commandsstop -->
