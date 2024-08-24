package static

import (
	"embed"
	"io/fs"
	"log"
	"net/http"

	"github.com/kataras/iris/v12"
)

//go:embed all:dist
var dist embed.FS

type Static struct{}

func New() *Static {
	return &Static{}
}

func (s *Static) Handler() iris.Handler {
	assets, err := fs.Sub(dist, "dist")
	if err != nil {
		log.Printf("Error accessing embedded files: %v", err)
		return func(ctx iris.Context) {
			ctx.StatusCode(500)
			ctx.WriteString("Internal Server Error")
		}
	}

	return iris.FileServer(http.FS(assets), iris.DirOptions{
		IndexName: "index.html",
		ShowList:  true, // Enable directory listing for debugging
	})
}
