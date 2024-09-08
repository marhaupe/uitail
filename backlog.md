Before open source:

- fix flicker when typing
- refactoring
- remove / obfuscate / cleanup test data
- figure out how to work around pipe buffer sizes
  - we could try to run a separate process that approximates the pipe buffer size by printing a growing amount of data
    for that to work, we'd need to be able to reset the client state from the server
  - while we're figuring this out, we should ensure that there are ways around broken up logs, e.g. a "show next X lines" feature
  - also, add a "caveats" section to the readme
- add a readme
- publish via goreleaser

Features:

- filter out messages
- fix restarting a stopped command
