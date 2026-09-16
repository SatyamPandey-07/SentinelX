// Command healthcheck pings every SentinelX service and dashboard endpoint
// and prints a pass/fail report. It exists so a non-technical tester (see
// docs/RUNBOOK.md) can run one command instead of opening a dozen browser
// tabs to find out whether the stack is actually up.
//
// Usage:
//
//	go run .                  # check everything on localhost
//	go run . -host 127.0.0.1  # check a different host
//	go run . -timeout 10s     # allow slower machines more time per check
package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"sort"
	"sync"
	"time"
)

type check struct {
	group string // "core" or "dashboard"
	name  string
	path  string // e.g. ":8080/actuator/health"
	// acceptable treats any of these status codes as healthy; a login
	// redirect (302) counts as "the service answered", which is what
	// this tool cares about -- it is not asserting on response bodies.
	acceptable []int
}

type result struct {
	check      check
	statusCode int
	err        error
	elapsed    time.Duration
}

var checks = []check{
	{"core", "Frontend", ":3000", []int{200}},
	{"core", "API Gateway", ":8080/actuator/health", []int{200}},
	{"core", "Auth Service", ":8081/actuator/health", []int{200}},
	{"core", "Incident Service", ":8082/actuator/health", []int{200}},
	{"core", "Search Service", ":8086/actuator/health", []int{200}},
	{"core", "OpenSearch", ":9200/_cluster/health", []int{200}},

	{"dashboard", "Grafana", ":3001", []int{200, 302}},
	{"dashboard", "Kafka UI", ":8095", []int{200}},
	{"dashboard", "OpenSearch Dashboards", ":5601", []int{200, 503}},
	{"dashboard", "Jaeger", ":16686", []int{200}},
	{"dashboard", "Prometheus", ":9090", []int{200, 302}},
	{"dashboard", "Mailhog", ":8025", []int{200}},
}

const (
	green  = "\033[32m"
	red    = "\033[31m"
	yellow = "\033[33m"
	dim    = "\033[2m"
	bold   = "\033[1m"
	reset  = "\033[0m"
)

func main() {
	host := flag.String("host", "localhost", "host to check (e.g. 127.0.0.1, or a friend's LAN IP)")
	timeout := flag.Duration("timeout", 5*time.Second, "per-check timeout")
	flag.Parse()

	client := &http.Client{Timeout: *timeout}
	results := make([]result, len(checks))

	var wg sync.WaitGroup
	for i, c := range checks {
		wg.Add(1)
		go func(i int, c check) {
			defer wg.Done()
			results[i] = run(client, "http://"+*host+c.path, c)
		}(i, c)
	}
	wg.Wait()

	fmt.Printf("\n%sSentinelX health check%s  %s(target: %s)%s\n\n", bold, reset, dim, *host, reset)

	failures := printGroup("Core product path", "core", results)
	failures += printGroup("Dashboards", "dashboard", results)

	fmt.Println()
	if failures == 0 {
		fmt.Printf("%sAll %d checks passed.%s\n", green, len(checks), reset)
		return
	}
	fmt.Printf("%s%d of %d checks failed.%s See docs/RUNBOOK.md for what each service needs to start.\n", red, failures, len(checks), reset)
	os.Exit(1)
}

func run(client *http.Client, url string, c check) result {
	start := time.Now()
	resp, err := client.Get(url)
	elapsed := time.Since(start)
	if err != nil {
		return result{check: c, err: err, elapsed: elapsed}
	}
	defer resp.Body.Close()
	return result{check: c, statusCode: resp.StatusCode, elapsed: elapsed}
}

func printGroup(title, group string, results []result) int {
	fmt.Printf("%s%s%s\n", bold, title, reset)
	failures := 0

	var rows []result
	for _, r := range results {
		if r.check.group == group {
			rows = append(rows, r)
		}
	}
	sort.Slice(rows, func(i, j int) bool { return rows[i].check.name < rows[j].check.name })

	for _, r := range rows {
		ok := r.err == nil && contains(r.check.acceptable, r.statusCode)
		mark := green + "  OK  " + reset
		detail := fmt.Sprintf("%s%dms%s", dim, r.elapsed.Milliseconds(), reset)
		if !ok {
			failures++
			mark = red + " FAIL " + reset
			if r.err != nil {
				detail = yellow + "not reachable -- is it started?" + reset
			} else {
				detail = fmt.Sprintf("%sunexpected status %d%s", yellow, r.statusCode, reset)
			}
		}
		fmt.Printf("  [%s] %-24s %s\n", mark, r.check.name, detail)
	}
	fmt.Println()
	return failures
}

func contains(xs []int, x int) bool {
	for _, v := range xs {
		if v == x {
			return true
		}
	}
	return false
}
