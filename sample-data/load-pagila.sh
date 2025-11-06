#!/bin/bash
# Script to load Pagila sample database into PostgreSQL Docker container

CONTAINER_NAME="dataask-db"
DB_NAME="pagila"
DB_USER="postgres"
DB_PASSWORD="mysecretpassword"
DB_PORT="15432"
HOST="localhost"

echo "=========================================="
echo "Loading Pagila Sample Database"
echo "=========================================="

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "Error: Container $CONTAINER_NAME is not running"
    exit 1
fi

echo "Step 1: Creating database 'pagila'..."
PGPASSWORD=$DB_PASSWORD psql -h $HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
PGPASSWORD=$DB_PASSWORD psql -h $HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" || {
    echo "Error: Failed to create database"
    exit 1
}

echo "Step 2: Loading schema..."
PGPASSWORD=$DB_PASSWORD psql -h $HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f pagila-schema.sql || {
    echo "Error: Failed to load schema"
    exit 1
}

echo "Step 3: Loading data (this may take a minute)..."
PGPASSWORD=$DB_PASSWORD psql -h $HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f pagila-data.sql || {
    echo "Error: Failed to load data"
    exit 1
}

echo ""
echo "=========================================="
echo "Pagila database loaded successfully!"
echo "=========================================="
echo ""
echo "Database: $DB_NAME"
echo "Connection: postgresql://$DB_USER:$DB_PASSWORD@$HOST:$DB_PORT/$DB_NAME"
echo ""
echo "To verify, run:"
echo "  psql -h $HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\\dt'"
echo ""


