#!/bin/sh
echo "Start copy of static files to volume"
echo "Copying files from /static to /output..."
if [ -d "/static" ] && [ "$(ls -A /static)" ]; then
    cp -r /static/* /output/
    echo "Copy completed successfully"
else
    echo "No files to copy"
    exit 0
fi
