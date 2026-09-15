-- Initialize isolated databases for SentinelX microservices
-- Rule: Avoid shared databases between microservices
--
-- sentinelx_auth is NOT created here: the postgres image already creates
-- it from the POSTGRES_DB env var before this script runs, and init
-- scripts run with ON_ERROR_STOP=1 — a redundant "CREATE DATABASE
-- sentinelx_auth" here previously aborted the whole script on that single
-- error, silently skipping every database below it.

CREATE DATABASE sentinelx_incident;
CREATE DATABASE sentinelx_location;
CREATE DATABASE sentinelx_audit;
CREATE DATABASE sentinelx_analytics;

-- Connect to location DB and enable PostGIS extension if available
\c sentinelx_location;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sentinelx_incident;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sentinelx_auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sentinelx_audit;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c sentinelx_analytics;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
