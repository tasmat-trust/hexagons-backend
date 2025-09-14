PGPASSWORD=xxx pg_dump \
  --host=render_url \
  --port=5432 \
  --username=yyy_user \
  --dbname=yyy \
  --format=custom \
  --file=prod-yyy.dump

  PGPASSWORD=xxx pg_restore \
  --host=localhost \
  --port=5432 \
  --username=yyy_user \
  --dbname=yyy \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  prod-yyy.dump