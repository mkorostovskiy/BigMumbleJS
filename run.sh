#!/bin/bash
# Author : Mark Korostovskiy
# Email : mark.korostovskiy@stud.hs-bochum.de
# Content : This script will start all the necessary files to get the BigMumbleJS-Bot running
# Version : 1.0

node ./src/mumble.js & node ./src/scraper.js
exit 0
