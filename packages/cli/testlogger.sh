#!/bin/bash

print() {
	printf '%s' "$1"
	sleep 0.01
}

print "🚀 running script now"
while true; do
	print "dev: object {\"dev\":\"dev\"}"
	print "dev: array [1, 2, 3, 4]"
	print "dev: large array [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]"
	print "dev: largeobject {\"a\":\"dev\",\"b\":\"dev\",\"c\":\"dev\",\"d\":\"dev\",\"e\":\"dev\",\"f\":\"dev\",\"g\":\"dev\"}"
	print "error Error: test error"
	sleep 5
done
printf "✅ done\n"
