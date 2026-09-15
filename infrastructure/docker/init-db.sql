-- Initialize isolated databases for SentinelX microservices
-- Rule: Avoid shared databases between microservices

CREATE DATABASE sentinelx_auth;
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
