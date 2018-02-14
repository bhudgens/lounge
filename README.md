# Overview
A simple service that 301's a source to a destination for starphleet.

## Redirects JSON File

The [redirects](/redirects.json) file is where you configure source and destinations for a domain.  The file should take the form that looks like this:

```
{
  "test.com": {
    "/source/path":"https://domain.com/and/final/path"
  }
}
```

## Orders Configuration

```
# Default Redirect for hits not found in config
export DEFAULT_REDIRECT="https://domain.com/and/path" [default "https://glg.it"];
# Override the path to the JSON file with redirects
export REDIRECT_FILE_PATH || "./redirects.json";
```
