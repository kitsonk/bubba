# bubba

A GitHub tool for making Eric's life easier

## Commands

### create

`bubba create <command>` requires a sub-command.

#### label

`bubba create label <name> <color> [options]` will create a label, with the specified color across the Dojo 2 repositories.  For example:

```sh
> bubba create label foo-bar cccccc
```

Would create the label `foo-bar` across all the Dojo 2 repositories.

The command will output the success or failure of creating the label for each repository.

### release

`bubba release <repo> <tag> [options]` will generate a set of release notes based on the commit comments that were supplied in the commit messages.  By default, the release notes will be generated using the previous tag before the one specified.  For example:

```sh
> bubba release widget-core v2.0.0-beta1.4
```

Would generate a set of release notes as a release on `dojo/widget-core` for the commits between `v2.0.0-beta1.4` and `v2.0.0-beta1.3`.  By default, the releases are unpublished, so they can be reviewed before publishing.  A link to the release notes will be output to make it easy to review the notes and publish them.

### tags

`bubba tags <repo>` will output the list of tags for a particular repository.  Each tag will be output, and those tags that are already released will be noted with a `[released]` after the tag name.

## License

Apache License, Version 2.0; Copyright 2017 by Kitson P. Kelly
