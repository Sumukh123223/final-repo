#!/bin/bash

# Simple HTTP Server for CleanSpark Website
# This allows ES modules to load properly (required for AppKit)

echo "🚀 Starting local server..."
echo "📂 Serving files from: $(pwd)"
echo ""
echo "🌐 Open your browser and go to:"
echo "   http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Python HTTP server on port 8000
python3 -m http.server 8000

