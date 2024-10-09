package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
)

//go:embed website/dist/*
var files embed.FS

func main() {
	publicFiles, err := fs.Sub(files, "website/dist")
	if err != nil {
		log.Fatal(err)
	}
	fs := http.FileServer(http.FS(publicFiles))

	http.Handle("/", fs)
	log.Println("Serving files on http://localhost:8080")
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
