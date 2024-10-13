# uitail

[![Project Status: Active](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![GitHub release](https://img.shields.io/github/release/marhaupe/uitail.svg)](https://github.com/marhaupe/uitail/releases/)

> A modern, interactive `tail -f` alternative with a beautiful UI

uitail is a powerful tool for developers who need to monitor and analyze log output in real-time. It provides a rich, interactive interface that makes it easy to navigate, search, and filter log entries, enhancing your debugging and monitoring workflow.

![uitail demo](.github/demo.gif)

## Demo

You can check out a live demo [here](https://uitail-demo.api.marhaupe.com).

## Features

- **Real-time log monitoring**: Watch your logs update live, just like `tail -f`
- **Interactive UI**: Navigate and explore logs with ease using keyboard shortcuts
- **Powerful filtering**: Quickly find the information you need with regex-based filtering
- **Manage your process**: Restart your process with the click of a button

## Installation

### Homebrew

```bash
brew tap marhaupe/uitail https://github.com/marhaupe/uitail
brew install uitail
```

### Manual Installation

Download the latest binary for your platform from the [releases page](https://github.com/marhaupe/uitail/releases).

## Quick Start

```bash
uitail "your_command_here"
```

For example:

```bash
uitail "npm run dev"
```

This will start the uitail agent and open the UI in your default browser.

## Usage

```
uitail [options] "command"
```

### Options

- `-p, --port <number>`: Specify the port for the uitail agent (default: 8765)
- `-h, --help`: Display help information
- `-v, --version`: Display version information

## Keyboard Shortcuts

- `j` / `k` or `↓` / `↑`: Navigate between log entries
- `l` or `→`: Interact with the log entry (e.g. open, copy, etc.)
- `/`: Focus the filter input
- `Esc`: Blur the filter input

For a full list of shortcuts, refer to the in-app tooltips.
