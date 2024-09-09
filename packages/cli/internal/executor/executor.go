package executor

import (
	"fmt"
	"io"
	"os/exec"
)

type Executor struct {
	Command string
	Out     io.Writer
	cmd     *exec.Cmd
}

// We might want to revisit error handling at some point, but for now this is good enough.
func (e *Executor) Run() {
	if e.cmd != nil {
		return
	}
	go func() {
		e.cmd = exec.Command("bash", "-c", e.Command)
		e.cmd.Stdout = e.Out
		e.cmd.Stderr = e.Out
		err := e.cmd.Run()
		if err != nil {
			if err.Error() == "signal: killed" {
				return
			}
			fmt.Println("Error running command:", err)
		}
	}()
}

func (e *Executor) Stop() error {
	if e.cmd == nil {
		return nil
	}
	err := e.cmd.Process.Kill()
	e.cmd = nil
	return err
}

func (e *Executor) Restart() error {
	if e.cmd != nil {
		err := e.Stop()
		if err != nil {
			return err
		}
	}
	e.Run()
	return nil
}
