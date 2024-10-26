package cmd

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	"github.com/marhaupe/uitail/internal/executor"
	"github.com/marhaupe/uitail/internal/logs"
	"github.com/marhaupe/uitail/internal/static"
	"github.com/spf13/cobra"
	"golang.org/x/term"
)

var (
	version string
	port    int
	rootCmd = &cobra.Command{
		Use:     "uitail",
		Short:   "uitail is like `tail -f` but with a beautiful UI",
		Example: "uitail \"ping google.com\"",
		Version: version,
		Args:    cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			root := New(args[0])
			err := root.Start()
			if err != nil {
				os.Exit(1)
			}
		},
	}
)

func init() {
	rootCmd.Flags().IntVarP(&port, "port", "p", 8765, "Port to start the agent on")
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
	executor     *executor.Executor
}

func New(command string) *Root {
	logsService := logs.New()
	return &Root{
		logService: logsService,
		staticServer: &static.Static{
			Command: command,
			Port:    port,
		},
		executor: &executor.Executor{
			Command: command,
			Out:     logsService,
		},
	}
}

func (a *Root) Start() error {
	a.executor.Run()
	app := iris.New()
	app.Logger().SetTimeFormat("")

	crs := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
	})
	app.UseRouter(crs)

	iris.RegisterOnInterrupt(func() {
		a.executor.Stop()
		timeout := 10 * time.Second
		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		defer cancel()
		app.Shutdown(ctx)
	})

	app.Post("/restart", func(ctx iris.Context) {
		err := a.executor.Restart()
		if err != nil {
			ctx.StatusCode(iris.StatusInternalServerError)
			ctx.WriteString(fmt.Sprintf("Error restarting command: %s", err))
			return
		}
		ctx.StatusCode(iris.StatusOK)
		ctx.WriteString("OK")
	})
	app.Any("/events", a.logService.EventHandler())
	app.Get("/logs", a.logService.GetLogs())
	app.Get("/{asset:path}", a.staticServer.Handler())

	clearScreen()
	printStartupLogs(port)
	go handleKeyPresses(port)

	return app.Listen(fmt.Sprintf(":%d", port),
		iris.WithConfiguration(iris.Configuration{
			DisableStartupLog: true,
			IgnoreServerErrors: []string{
				iris.ErrServerClosed.Error(),
			},
		}),
	)
}

func printStartupLogs(port int) {
	url := fmt.Sprintf("http://localhost:%d", port)
	fmt.Printf("uitail is running on %s\n\n", color.New(color.FgCyan).Sprintf(url))
	bold := color.New(color.Bold).SprintFunc()
	light := color.New(color.FgBlack).SprintFunc()
	fmt.Println("Shortcuts:")
	fmt.Printf("› %s | %s\n", bold("w + enter"), light("Open in browser"))
	fmt.Printf("› %s | %s\n", bold("q + enter"), light("Quit"))
}

func handleKeyPresses(port int) {
	reader := bufio.NewReader(os.Stdin)
	for {
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		switch input {
		case "w":
			openWebBrowser(port)
		case "q":
			os.Exit(0)
		}
	}
}

func openWebBrowser(port int) {
	url := fmt.Sprintf("http://localhost:%d", port)
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}

	if err != nil {
		fmt.Printf("Error opening web browser: %v\n", err)
	}
}

func clearScreen() {
	fd := int(os.Stdout.Fd())
	if !term.IsTerminal(fd) {
		return
	}
	_, height, err := term.GetSize(fd)
	if err != nil {
		return
	}
	for i := 0; i < height-2; i++ {
		fmt.Println()
	}
	// Move cursor to top-left corner
	fmt.Print("\033[0;0H")
}
