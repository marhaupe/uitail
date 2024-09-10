Before open source:

- publish via goreleaser

Features:

- open ui in browser by pressing -u
- filter out messages
- figure out how to work around pipe buffer sizes
  - we could try to run a separate process that approximates the pipe buffer size by printing a growing amount of data
    for that to work, we'd need to be able to reset the client state from the server
  - while we're figuring this out, we should ensure that there are ways around broken up logs, e.g. a "show next X lines" feature
