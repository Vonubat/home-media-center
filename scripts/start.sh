#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

set -a
source .env
if [ -f .secrets ]; then
    source .secrets
fi
set +a

if [[ -z "$TIMEZONE" ]]; then
  read -p "Enter timezone (e.g. Etc/UTC, Europe/Minsk, Asia/Tbilisi): " timezone
  echo "TIMEZONE=$timezone" >> .secrets
fi

mkdir -p $CONFIGS_FOLDER/{seerr}
mkdir -p $BACKDROPS_FOLDER
mkdir -p $CACHE_FOLDER/jellyfin
mkdir -p $COLD_FOLDER/downloads/content
mkdir -p $COLD_FOLDER/media/{shows,movies}
mkdir -p $HOT_FOLDER/downloads/content
mkdir -p $HOT_FOLDER/media/{shows,movies}

set -a
source .env
if [ -f .secrets ]; then
    source .secrets
fi
set +a

docker compose --env-file .env --env-file .secrets -f compose.yml up -d

if [ ! -f ${CONFIGS_FOLDER}/prowlarr/Definitions/Custom/therarbg.yml ]; then
    sleep 5
    mkdir -p ${CONFIGS_FOLDER}/prowlarr/Definitions/Custom
    cp indexers/* ${CONFIGS_FOLDER}/prowlarr/Definitions/Custom
fi

if [[ -z "$JELLYFIN_API_KEY" ]]; then
    echo "Add JELLYFIN_API_KEY secret to .secrets file for backdrops sync to work"
fi
