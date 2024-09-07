Features:

- Test: Restart session (need to prototype this, maybe we need to change the API, e.g. uitail "nx run website:serve")
  - In particular environment variables
- persist filter state in URL
- filter out messages
- fix flicker when typing
- unify log / fmt.Println usage in cli
- figure out how to work around pipe buffer sizes
  - we could try to run a separate process that approximates the pipe buffer size by printing a growing amount of data
    for that to work, we'd need to be able to reset the client state from the server
  - while we're figuring this out, we should ensure that there are ways around broken up logs, e.g. a "show next X lines" feature
- fix restarting a stopped command
