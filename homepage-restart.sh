#!/bin/bash
docker stop home-media-center-homepage
docker rm home-media-center-homepage
./start.sh
