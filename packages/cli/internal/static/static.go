package static

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"strings"

	"github.com/kataras/iris/v12"
)

//go:embed all:dist
var dist embed.FS

type Static struct {
	Command string
	Port    int
}

func (s *Static) Handler() iris.Handler {
	assets, err := fs.Sub(dist, "dist")
	if err != nil {
		fmt.Printf("Error accessing embedded files: %v\n", err)
		return func(ctx iris.Context) {
			ctx.StatusCode(500)
			ctx.WriteString("Internal Server Error")
		}
	}

	return func(ctx iris.Context) {
		path := ctx.Request().URL.Path
		if path == "/" || path == "/index.html" {
			content, err := fs.ReadFile(assets, "index.html")
			if err != nil {
				ctx.StatusCode(http.StatusInternalServerError)
				ctx.WriteString("Error reading index.html")
				return
			}
			config := struct {
				Command    string `json:"command"`
				BackendURL string `json:"backendURL"`
			}{
				Command:    s.Command,
				BackendURL: fmt.Sprintf("http://localhost:%d", s.Port),
			}
			configJSON, err := json.Marshal(config)
			if err != nil {
				ctx.StatusCode(http.StatusInternalServerError)
				ctx.WriteString("Error marshalling config")
				return
			}
			configScript := fmt.Sprintf("<script>window.config = %s;</script>", configJSON)
			modifiedContent := strings.ReplaceAll(string(content), "<!--#echo var=\"configscript\" -->", configScript)

			ctx.ContentType("text/html")
			ctx.WriteString(modifiedContent)
			return
		}

		iris.FileServer(http.FS(assets), iris.DirOptions{
			IndexName: "index.html",
		})(ctx)
	}
}
