package cmd

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/acarl005/stripansi"
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
	stdinReader  *bufio.Reader
	line         []byte
}

type Log struct {
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func New() *Root {
	in := os.Stdin
	bufSize := 65536
	return &Root{
		stdinReader:  bufio.NewReaderSize(in, bufSize),
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

func (a *Root) startReadLoop() error {
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
			line, err := a.nextLine()
			if line == nil {
				continue
			}
			if err != nil {
				log.Printf("error reading line: %s", err)
			}
			l, err := a.parseText()
			if err != nil {
				log.Printf("error parsing line: %s", err)
				continue
			}
			err = a.eventService.Publish(events.Log{
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
	var err error
	openingBraceCount := 0
	closingBraceCount := 0
	lines := [][]byte{}
	for line := r.line; line != nil; line, err = r.nextLine() {
		if err != nil {
			return nil, err
		}
		lines = append(lines, line)
		for _, char := range line {
			if char == '{' {
				openingBraceCount++
			}
			if char == '}' {
				closingBraceCount++
			}
		}
		if openingBraceCount == closingBraceCount {
			message := bytes.Join(lines, []byte{'\n'})
			return &Log{
				Timestamp: timestamp,
				Message:   stripansi.Strip(string(message)),
			}, nil
		}

	}
	return nil, errors.New("no new log group found")
}

func (r *Root) nextLine() ([]byte, error) {
	line, err := r.readLine()
	if line == nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	r.line = line
	return line, nil
}

func (r *Root) readLine() ([]byte, error) {
	var wasPrefix bool
	var lineBuf []byte
	for {
		line, isPrefix, err := r.stdinReader.ReadLine()
		if err == io.EOF {
			return nil, nil
		} else if err != nil {
			return nil, err
		}
		if wasPrefix || isPrefix {
			wasPrefix = isPrefix
			lineBuf = append(lineBuf, line...)
			if !isPrefix {
				return lineBuf, nil
			}
			continue
		}
		return line, nil
	}
}
