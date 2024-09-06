package cmd

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
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
	port int
)

func init() {
	rootCmd.Flags().IntVarP(&port, "port", "p", 8787, "port to start the server on")
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

type Root struct {
	eventService *events.EventService
	staticServer *static.Static
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
		staticServer: static.New(),
	}
}

func (a *Root) Start() error {
	go func() {
		config := iris.WithConfiguration(iris.Configuration{
			DisableStartupLog: true,
		})
		app := iris.New()

		crs := cors.New(cors.Options{
			AllowedOrigins: []string{"*"},
		})
		app.UseRouter(crs)

		iris.RegisterOnInterrupt(func() {
			timeout := 10 * time.Second
			ctx, cancel := context.WithTimeout(context.Background(), timeout)
			defer cancel()
			app.Shutdown(ctx)
			// Maybe close event service here?
		})

		app.Any("/events", a.eventService.Handler())
		app.Get("/{asset:path}", a.staticServer.Handler())

		if err := app.Listen(fmt.Sprintf(":%d", port), config); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	fmt.Printf("🚀 Running uitail on http://localhost:%d\n", port)

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
			if char == '{' || char == '[' {
				openingBraceCount++
			}
			if char == '}' || char == ']' {
				closingBraceCount++
			}
		}
		if openingBraceCount == closingBraceCount {
			message := bytes.Join(lines, []byte{'\n'})
			return &Log{
				Timestamp: timestamp,
				Message:   string(message),
			}, nil
		}
		r.nextLine()
	}
}

func (r *Root) nextLine() {
	r.line = []byte{}
	for {
		r.in.Scan()
		char := r.in.Bytes()
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
