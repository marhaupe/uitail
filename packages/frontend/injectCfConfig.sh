#!/bin/sh

# Define the config as a JSON string
CONFIG='{ "useDemoServer": true }'

# Create the script tag with the config
CONFIG_SCRIPT="<script>window.config = $CONFIG;</script>"

# Use sed to replace the placeholder in index.html with the config script
# This approach works on both macOS and Linux
sed "s|<!--#echo var=\"configscript\" -->|$CONFIG_SCRIPT|" ./dist/index.html > ./dist/index.html.tmp && mv ./dist/index.html.tmp ./dist/index.html

echo "Config injected successfully into ./dist/index.html"

