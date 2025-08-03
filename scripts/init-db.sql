-- Create databases for different services
CREATE DATABASE IF NOT EXISTS proposal_writer;
CREATE DATABASE IF NOT EXISTS proposal_writer_auth;
CREATE DATABASE IF NOT EXISTS proposal_writer_proposals;

-- Create extensions
\c proposal_writer;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c proposal_writer_auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c proposal_writer_proposals;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";