Features:

- fix flicker when typing
- filter out messages
- unify log / fmt.Println usage in cli
- figure out how to work around pipe buffer sizes
  - we could try to run a separate process that approximates the pipe buffer size by printing a growing amount of data
    for that to work, we'd need to be able to reset the client state from the server
  - while we're figuring this out, we should ensure that there are ways around broken up logs, e.g. a "show next X lines" feature
  - also, add a "caveats" section to the readme
- fix restarting a stopped command
- add a readme
