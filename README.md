# uitail

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> uitail is like `tail -f` but with a beautiful UI.

If you are like me and like debugging by printing things to the console, then you probably have struggled by finding the logs you want to see in the sea of text. If you're unlucky, your terminal might even truncate the logs at some point. Of course you could work around this by piping the logs to other command line programs, but what's the fun in that?

uitail is a simple tool that solves this problem by providing a beautiful UI to interact with your logs. Keyboard navigation is baked in, so you can focus on actually debugging efficiently.

## Installation

### Homebrew

```bash
brew tap marhaupe/uitail https://github.com/marhaupe/uitail

brew install uitail
```

### Manually

Grab the latest release [binaries](https://github.com/marhaupe/uitail/releases).

## Usage

> uitail "<your command here>" [options]

Running uitail will start an agent. You can access the UI on `http://localhost:8765`.

![Example](.github/demo.gif)

## Caveats

uitail intercepts the output of your command through a pipe. For very large log entries, the buffer size of this pipe may cause individual logs to be split into multiple chunks. This is a limitation of the underlying system and not specific to uitail itself. There will be ways to work around this, but as of now, you'll have to be aware of this, especially if you're filtering out messages.