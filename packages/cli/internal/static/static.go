package static

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"os"
)

//go:embed all:dist
var dist embed.FS

type Static struct {
	port int
}

func New(port int) *Static {
	return &Static{
		port: port,
	}
}

func (s *Static) Serve() {
	assets, _ := fs.Sub(dist, "static")
	fs := http.FileServer(http.FS(assets))
	http.Handle("/", http.StripPrefix("/", fs))
	fmt.Printf("running uitail on http://localhost:%d\n", s.port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", s.port), nil)
	if err != nil {
		fmt.Println("error running uitail: ", err)
		os.Exit(1)
	}
}
