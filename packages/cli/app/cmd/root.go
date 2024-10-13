package cmd

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	"github.com/marhaupe/uitail/internal/executor"
	"github.com/marhaupe/uitail/internal/logs"
	"github.com/marhaupe/uitail/internal/static"
	"github.com/spf13/cobra"
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
		timeout := 10 * time.Second
		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		defer cancel()
		app.Shutdown(ctx)
		a.executor.Stop()
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

	fmt.Printf("🚀 Running uitail on http://localhost:%d\n", port)
	return app.Listen(fmt.Sprintf(":%d", port),
		iris.WithConfiguration(iris.Configuration{
			DisableStartupLog: true,
			IgnoreServerErrors: []string{
				iris.ErrServerClosed.Error(),
			},
		}),
	)
}
