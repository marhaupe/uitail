package cmd

import (
	"bufio"
	"bytes"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/marhaupe/uitail/internal/events"
	"github.com/marhaupe/uitail/internal/static"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:     "uitail",
	Short:   "uitail is a tail-like tool with a beautiful UI",
	Example: "ping google.com 2>&1 | uitail",
	Run: func(cmd *cobra.Command, args []string) {
		root := New()
		root.Start()
	},
}

var (
	shouldStartWebServer bool
	webServerPort        int
	eventServerPort      int
)

func init() {
	rootCmd.Flags().BoolVarP(&shouldStartWebServer, "web", "w", true, "start web server")
	rootCmd.Flags().IntVarP(&webServerPort, "port", "p", 8787, "port to start web server on")
	rootCmd.Flags().IntVarP(&eventServerPort, "event-port", "e", 8788, "port to start event server on")
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

type Root struct {
	eventService *events.EventService
	in           *bufio.Scanner
	line         []byte
}

type Log struct {
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func New() *Root {
	in := os.Stdin
	scanner := bufio.NewScanner(in)
	scanner.Split(bufio.ScanBytes)
	return &Root{
		in:           scanner,
		eventService: events.New(),
	}
}

func (a *Root) Start() error {
	if shouldStartWebServer {
		static := static.New(webServerPort, eventServerPort)
		go static.Serve()
	}
	go a.eventService.Start(eventServerPort)
	return a.startReadLoop()
}

func (r *Root) startReadLoop() error {
	terminateChan := make(chan os.Signal, 1)
	signal.Notify(terminateChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-terminateChan
		os.Exit(0)
	}()
	for {
		select {
		case <-terminateChan:
			return nil
		default:
			r.nextLine()
			if r.line == nil {
				continue
			}
			l, err := r.parseText()
			if err != nil {
				log.Printf("error parsing line: %s", err)
				continue
			}
			err = r.eventService.Publish(events.Log{
				Timestamp: l.Timestamp,
				Message:   l.Message,
			})
			if err != nil {
				log.Printf("error publishing line: %s", err)
			}
		}
	}
}

func (r *Root) parseText() (*Log, error) {
	timestamp := time.Now()
	openingBraceCount := 0
	closingBraceCount := 0
	lines := [][]byte{}
	for {
		lines = append(lines, r.line)
		for _, char := range r.line {
			if char == '{' {
				openingBraceCount++
			}
			if char == '}' {
				closingBraceCount++
			}
		}
		if openingBraceCount == closingBraceCount {
			message := bytes.Join(lines, []byte{'\n'})
			// TODO: we need a way to clear logs from the UI
			// TODO: make sure we can restart the process (to clear the logs, which we should fix, but anyways) without clearing state (filters, session)
			return &Log{
				Timestamp: timestamp,
				Message:   string(message),
			}, nil
		}
		r.nextLine()

	}
}

// TODO: Maybe we need to make sure that this does not run forever?
func (r *Root) nextLine() {
	r.line = []byte{}
	for {
		r.in.Scan()
		char := r.in.Bytes()
		// Previously we were using bufio.ReadLine and then bufio.Scanner + bufio.ScanLine,
		// but both were running into issues where a lot of empty reads would cause EOF errors.
		// My best guess is that due to the async nature of this program, lines were partially
		// being written, and subsequent reads would be reading empty bytes because the line
		// still hadn't been fully written. The fact that just sleeping for a millisecond
		// fixes it confirms that something like that was happening.
		if len(char) == 0 {
			time.Sleep(time.Millisecond * 10)
			continue
		}
		if char[0] == '\n' {
			return
		}
		r.line = append(r.line, char...)
	}
}
