#!/bin/bash
set -e

# This script is now a no-op
# The JS scripts will be run by the post-init.sh script after PostgreSQL is fully running
echo "Skipping JavaScript initialization during PostgreSQL initialization phase."
echo "These scripts will be run in the post-initialization phase instead."
exit 0 