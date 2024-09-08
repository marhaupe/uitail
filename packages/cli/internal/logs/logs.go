package logs

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/kataras/iris/v12"
	"github.com/r3labs/sse/v2"
)

type LogService struct {
	logs      []Log
	sseServer *sse.Server
	sessions  sync.Map
}

type Session struct {
	streamID        string
	filter          string
	caseInsensitive bool
}

type Log struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func New() *LogService {
	service := &LogService{
		sseServer: sse.New(),
		logs:      make([]Log, 0),
		sessions:  sync.Map{},
	}
	service.setup()
	return service
}

func (s *LogService) EventHandler() iris.Handler {
	return func(ctx iris.Context) {
		s.sseServer.ServeHTTP(ctx.ResponseWriter(), ctx.Request())
	}
}

func (s *LogService) ClearHandler() iris.Handler {
	return func(ctx iris.Context) {
		s.logs = make([]Log, 0)
		ctx.StatusCode(iris.StatusOK)
		ctx.WriteString("OK")
	}
}

func (s *LogService) RestartHandler() iris.Handler {
	return func(ctx iris.Context) {
		// TODO: Implement
		ctx.StatusCode(iris.StatusOK)
		ctx.WriteString("OK")
	}
}

func (s *LogService) setup() {
	s.sseServer.AutoReplay = false
	s.sseServer.AutoStream = true
	s.sseServer.OnSubscribe = func(streamID string, sub *sse.Subscriber) {
		filter := sub.URL.Query().Get("filter")
		caseInsensitive := sub.URL.Query().Get("caseInsensitive") == "true"
		s.sessions.Store(streamID, Session{
			streamID:        streamID,
			filter:          filter,
			caseInsensitive: caseInsensitive,
		})
		err := s.replay(streamID)
		if err != nil {
			fmt.Printf("Error replaying logs for new stream: %s\n", err)
		}
	}
	s.sseServer.OnUnsubscribe = func(streamID string, sub *sse.Subscriber) {
		s.sessions.Delete(streamID)
	}
}

func (s *LogService) replay(token string) error {
	if !s.sseServer.StreamExists(token) {
		return fmt.Errorf("stream does not exist")
	}
	storedSession, ok := s.sessions.Load(token)
	if !ok {
		return fmt.Errorf("session does not exist")
	}
	session, ok := storedSession.(Session)
	if !ok {
		return fmt.Errorf("session is not of type session")
	}
	filteredLogs := make([]Log, 0)
	for _, log := range s.logs {
		if matchFilter(session, log) {
			filteredLogs = append(filteredLogs, log)
		}
	}
	data, err := json.Marshal(filteredLogs)
	if err != nil {
		return fmt.Errorf("error marshalling logs: %s", err)
	}
	s.sseServer.Publish(token, &sse.Event{
		Data: data,
	})
	return nil
}

func (s *LogService) Publish(l Log) error {
	s.logs = append(s.logs, l)
	data, err := json.Marshal([]Log{l})
	if err != nil {
		return fmt.Errorf("error marshalling log: %s", err)
	}
	s.sessions.Range(func(key, sessionData interface{}) bool {
		session, ok := sessionData.(Session)
		if !ok || !matchFilter(session, l) {
			return true
		}
		s.sseServer.Publish(session.streamID, &sse.Event{
			Data: data,
		})
		return true
	})

	return nil
}

func matchFilter(session Session, l Log) bool {
	if len(session.filter) > 0 {
		if session.caseInsensitive {
			return strings.Contains(strings.ToLower(l.Message), strings.ToLower(session.filter))
		}
		return strings.Contains(l.Message, session.filter)
	}
	return true
}
