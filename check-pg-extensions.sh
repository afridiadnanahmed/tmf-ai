#!/bin/bash
# Check available PostgreSQL extensions

echo "Checking PostgreSQL extensions..."

ssh -i ~/.ssh/id_rsa_tmf themzeni@192.64.117.125 -p 21098 'bash -lc "
PGPASSWORD=tmfaiproduct psql -h localhost -U themzeni_ai -d themzeni_tmfai -c \"SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name LIKE '\''%uuid%'\'' OR name LIKE '\''%crypto%'\'' ORDER BY name;\"
"'
