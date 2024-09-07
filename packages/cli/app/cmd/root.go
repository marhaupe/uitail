package cmd

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	"github.com/marhaupe/uitail/internal/logs"
	"github.com/marhaupe/uitail/internal/static"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:     "uitail",
	Short:   "uitail is a tail-like tool with a beautiful UI",
	Example: "uitail \"ping google.com\"",
	Args:    cobra.MinimumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		root := New(args[0])
		err := root.Start()
		if err != nil {
			fmt.Println("error starting uitail", err)
			os.Exit(1)
		}
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
	logService   *logs.LogService
	staticServer *static.Static
	command      string
	cmd          *exec.Cmd
}

type Log struct {
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func New(command string) *Root {
	return &Root{
		logService:   logs.New(),
		staticServer: static.New(),
		command:      command,
	}
}

func (a *Root) startCommand() error {
	if a.cmd != nil {
		return errors.New("command already started")
	}
	a.cmd = exec.Command("bash", "-c", a.command)
	a.cmd.Stdout = a
	a.cmd.Stderr = a
	go func() {
		if err := a.cmd.Run(); err != nil {
			log.Printf("error running command: %s", err)
		}
	}()
	return nil
}

func (a *Root) stopCommand() error {
	if a.cmd == nil {
		return errors.New("command not started")
	}

	err := a.cmd.Process.Kill()
	if err != nil {
		return err
	}
	a.cmd = nil
	return nil
}

func (a *Root) Start() error {
	err := a.startCommand()
	if err != nil {
		return err
	}
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

		app.Post("/restart", func(ctx iris.Context) {
			err := a.stopCommand()
			if err != nil {
				ctx.StatusCode(iris.StatusInternalServerError)
				ctx.WriteString(fmt.Sprintf("error stopping command: %s", err))
				fmt.Println("error stopping command", err)
				return
			}
			err = a.startCommand()
			if err != nil {
				ctx.StatusCode(iris.StatusInternalServerError)
				ctx.WriteString(fmt.Sprintf("error starting command: %s", err))
				fmt.Println("error starting command", err)
				return
			}
			ctx.StatusCode(iris.StatusOK)
			ctx.WriteString("OK")
		})
		app.Any("/events", a.logService.EventHandler())
		app.Post("/clear", a.logService.ClearHandler())
		app.Get("/{asset:path}", a.staticServer.Handler())

		if err := app.Listen(fmt.Sprintf(":%d", port), config); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	fmt.Printf("🚀 Running uitail on http://localhost:%d\n", port)
	a.startReadLoop()
	return nil
}

func (r *Root) startReadLoop() {
	terminateChan := make(chan os.Signal, 1)
	signal.Notify(terminateChan, os.Interrupt, syscall.SIGTERM)
	<-terminateChan
	os.Exit(0)
}

func (r *Root) Write(p []byte) (n int, err error) {
	l := &Log{
		Message:   strings.TrimRight(string(p), "\n"),
		Timestamp: time.Now().UTC(),
	}
	err = r.logService.Publish(logs.Log{
		Timestamp: l.Timestamp,
		Message:   l.Message,
	})
	if err != nil {
		return 0, err
	}
	return len(p), nil
}
