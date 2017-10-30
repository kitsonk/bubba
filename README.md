# bubba

A GitHub tool for making Eric's life easier

## Installation

It is best to install the package globally:

```sh
> npm install bubba-bot -g
```

Then the command should be available via `bubba` on the command line.

## Configuration

bubba needs a GitHub authorization token available in the environment with the key of `GITHUB_TOKEN`.  You will need to generate a _Personal access token_ for GitHub.  In order to do that, you will need to:

* Navigate to [GitHub Settings Tokens](https://github.com/settings/tokens)
* Click on _Generate new token_
* Provide a token description
* Provide access (recommended: **repo**, **notifications**, and **user**)
* Click on the _Generate token_ button
* Copy the personal access token that was generated
* Add personal access token to your environment
  * If you are on a Mac you would want to add this line to your `~/.bash_profile`:
    ```bash
    export GITHUB_TOKEN=<<GENERATED TOKEN>>
    ```

You should now be able to utilise `bubba`.

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

#### milestone

`bubba create milestone <title> <due> [options]` will create a milestone on the appropriate due date across the Dojo 2 repositories.  For example:

```sh
> bubba create milestone foo 2017-12-31
```

Would create a milestone named `foo` which would be due on the 21st December 2017.

The command will output the success ofr failure of creating the milestone for each repository.

### delete

#### milestone

`bubba delete milestone <title> [options]` would delete a milestone across the Dojo 2 repositories.  For example:

```sh
> bubba delete miletstone foo
```

Would delete a milestone named `foo` from all the Dojo 2 repositories.

### release

`bubba release <repo> <tag> [options]` will generate a set of release notes based on the commit comments that were supplied in the commit messages.  By default, the release notes will be generated using the previous tag before the one specified.  For example:

```sh
> bubba release widget-core v2.0.0-beta1.4
```

Would generate a set of release notes as a release on `dojo/widget-core` for the commits between `v2.0.0-beta1.4` and `v2.0.0-beta1.3`.  By default, the releases are unpublished, so they can be reviewed before publishing.  A link to the release notes will be output to make it easy to review the notes and publish them.

### tags

`bubba tags <repo>` will output the list of tags for a particular repository.  Each tag will be output, and those tags that are already released will be noted with a `[released]` after the tag name.

### update

#### milestone

`bubba update milestone <title> [options]` will update a milestone across the Dojo 2 repositories.  For example:

```sh
> bubba update milestone foo --due 2017-12-01
```

Would update the due date for the milestone named `foo` across the Dojo 2 repositories.

## License

Apache License, Version 2.0; Copyright 2017 by Kitson P. Kelly
