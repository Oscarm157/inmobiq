#!/bin/bash
# Inmobiq Scraper — cron wrapper
# Corre cada 2 días a las 3am: 0 3 */2 * * /root/inmobiq/scripts/run-scrape.sh

cd /root/inmobiq

echo "===== Scraper run: $(date) =====" >> logs/scraper.log

npx tsx scripts/scrape.ts --pages=5 >> logs/scraper.log 2>&1

echo "===== Finished: $(date) =====" >> logs/scraper.log
echo "" >> logs/scraper.log
