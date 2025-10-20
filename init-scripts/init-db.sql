-- Initialize CompanyMap database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS companymap_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial tables (these will be managed by Django migrations)
-- The Django app will handle table creation through migrations

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE companymap_db TO companymap_user;

-- Set timezone
SET timezone = 'UTC';

BEGIN;

-- 1️⃣ Create the base tables first (without foreign key dependencies)
CREATE TABLE IF NOT EXISTS TAXONOMY (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS COMPANY (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    domains TEXT[],
    default_insdustry VARCHAR(255),
    description TEXT,
    taxonomies_id UUID, -- FK added later
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAXONOMY_RELATIONSHIP (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    taxonomy_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2️⃣ Add foreign key constraints after all tables exist
ALTER TABLE TAXONOMY_RELATIONSHIP
    ADD CONSTRAINT fk_taxonomy_relationship_company
    FOREIGN KEY (company_id) REFERENCES COMPANY(id)
    ON DELETE CASCADE;

ALTER TABLE TAXONOMY_RELATIONSHIP
    ADD CONSTRAINT fk_taxonomy_relationship_taxonomy
    FOREIGN KEY (taxonomy_id) REFERENCES TAXONOMY(id)
    ON DELETE CASCADE;

ALTER TABLE COMPANY
    ADD CONSTRAINT fk_company_taxonomy_relationship
    FOREIGN KEY (taxonomies_id) REFERENCES TAXONOMY_RELATIONSHIP(id)
    ON DELETE SET NULL;

COMMIT;

CREATE TABLE IF NOT EXISTS OFFICE(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(255),
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    zip VARCHAR(255),
    country VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_headquarters BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (company_id) REFERENCES Company(id)
);

CREATE TABLE IF NOT EXISTS PERSON(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    zip VARCHAR(50),
    country VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    office_id UUID REFERENCES OFFICE(id),
    company_id UUID REFERENCES Company(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS USER_DATA(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES PERSON(id),
    phone VARCHAR(255),
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    zip VARCHAR(255),
    country VARCHAR(255),
    logins INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- User authentication table (separate from person profile)
CREATE TABLE IF NOT EXISTS custom_auth_user(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_data_id UUID REFERENCES USER_DATA(id),
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Never store plain passwords!
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    date_joined TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- OAuth accounts table for linking OAuth providers
CREATE TABLE IF NOT EXISTS oauth_account(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES custom_auth_user(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    provider_data JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

-- User sessions table for token-based auth
CREATE TABLE IF NOT EXISTS user_session(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES custom_auth_user(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_token(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES custom_auth_user(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS USER_WORLD(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES custom_auth_user(id),
    company_id UUID REFERENCES Company(id),
    taxonomy_interests_id UUID REFERENCES TAXONOMY(id),
    world_companies_id UUID[],
    world_people_id UUID[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS CITY(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ascii_name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    population INTEGER
);


-- One function: call as load_cities_from_csv(); or override default path with load_cities_from_csv('/path/file.csv')
CREATE OR REPLACE FUNCTION public.load_cities_from_csv(
  p_file text DEFAULT '/data/geonames-all-cities-with-a-population-1000.csv'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer;
BEGIN
  CREATE TEMP TABLE staging_cities(
    "Geoname ID" BIGINT,
    "Name" TEXT,
    "ASCII Name" TEXT,
    "Alternate Names" TEXT,
    "Feature Class" TEXT,
    "Feature Code" TEXT,
    "Country Code" TEXT,
    "Country name EN" TEXT,
    "Country Code 2" TEXT,
    "Admin1 Code" TEXT,
    "Admin2 Code" TEXT,
    "Admin3 Code" TEXT,
    "Admin4 Code" TEXT,
    "Population" TEXT,
    "Elevation" TEXT,
    "DIgital Elevation Model" TEXT,
    "Timezone" TEXT,
    "Modification date" TEXT,
    "LABEL EN" TEXT,
    "Coordinates" TEXT
  ) ON COMMIT DROP;

  -- Stream file to COPY and delete afterwards
  EXECUTE format(
    'COPY staging_cities FROM PROGRAM %L WITH (FORMAT csv, HEADER true, DELIMITER '';'' )',
    'bash -lc "cat ' || p_file || ' && rm -f ' || p_file || '"'
  );

  INSERT INTO public.city (name, ascii_name, country, latitude, longitude, population)
  SELECT
    COALESCE(NULLIF("Name", ''), 'Unknown'),
    COALESCE(NULLIF("ASCII Name", ''), COALESCE(NULLIF("Name", ''), 'Unknown')),
    COALESCE(NULLIF("Country name EN", ''), COALESCE(NULLIF("Country Code", ''), 'Unknown')),
    NULLIF(TRIM(split_part("Coordinates", ',', 1)), '')::DECIMAL(10,8),
    NULLIF(TRIM(split_part("Coordinates", ',', 2)), '')::DECIMAL(11,8),
    NULLIF(NULLIF("Population", ''), NULL)::INTEGER
  FROM staging_cities;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.load_cities_from_csv(text) TO companymap_user;
SELECT public.load_cities_from_csv('/data/geonames-all-cities-with-a-population-1000.csv');






-- Load companies from a CSV into COMPANY
-- Expected CSV: free_company_dataset.csv in /data/
-- Columns: country,founded,id,industry,linkedin_url,locality,name,region,size,website

CREATE OR REPLACE FUNCTION public.load_companies_from_csv(
  p_file text DEFAULT '/data/free_company_dataset.csv'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer;
BEGIN
  -- Staging table mirroring the CSV headers (all TEXT to be safe)
  CREATE TEMP TABLE staging_companies (
    country       TEXT,
    founded       TEXT,
    id            TEXT,   -- external PDL id (kept for de-dupe logic if desired)
    industry      TEXT,
    linkedin_url  TEXT,
    locality      TEXT,
    name          TEXT,
    region        TEXT,
    size          TEXT,
    website       TEXT
  ) ON COMMIT DROP;

  -- Stream file to COPY and delete afterwards
  EXECUTE format(
    'COPY staging_companies FROM PROGRAM %L WITH (FORMAT csv, HEADER true, DELIMITER '','')',
    'bash -lc "cat ' || p_file || ' && rm -f ' || p_file || '"'
  );

  /*
    Derive domain:
      - Prefer hostname from website (strip http(s)://, www., path, query).
      - Fallback to hostname from linkedin_url (usually linkedin.com — not ideal, but better than NULL).
      - Final fallback to 'unknown.local' to satisfy NOT NULL constraint on COMPANY.domain.
    Map:
      - name -> COMPANY.name
      - industry -> COMPANY.default_insdustry  (schema uses this exact column name)
      - domain -> COMPANY.domain
      - domains -> single-element array with the derived domain (if you want; otherwise NULL)
      - description left NULL (no description in free dataset)
  */
  WITH prepared AS (
    SELECT
      NULLIF(TRIM(name), '')                                          AS company_name,
      -- Extract host from website (preferred)
      LOWER(
        NULLIF(
          REGEXP_REPLACE(website, '^\s*(https?://)?(www\.)?([^/]+).*$','\3'),
          ''
        )
      )                                                               AS host_from_website,
      -- Extract host from linkedin_url (fallback)
      LOWER(
        NULLIF(
          REGEXP_REPLACE(linkedin_url, '^\s*(https?://)?(www\.)?([^/]+).*$','\3'),
          ''
        )
      )                                                               AS host_from_linkedin,
      NULLIF(TRIM(industry), '')                                      AS industry_text
    FROM staging_companies
    WHERE NULLIF(TRIM(name), '') IS NOT NULL
  ),
  to_insert AS (
    SELECT
      company_name,
      COALESCE(host_from_website, host_from_linkedin, 'unknown.local') AS derived_domain,
      industry_text
    FROM prepared
  )
  INSERT INTO public.company (name, domain, domains, default_insdustry)
  SELECT
    company_name,
    derived_domain,
    ARRAY[derived_domain]::TEXT[],
    industry_text
  FROM to_insert
  -- simple duplicate guard: avoid inserting if a company with same domain already exists
  WHERE NOT EXISTS (
    SELECT 1 FROM public.company c
    WHERE LOWER(c.domain) = LOWER(to_insert.derived_domain)
  );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;
-- Allow your app user to run it (optional but handy)
GRANT EXECUTE ON FUNCTION public.load_companies_from_csv(text) TO companymap_user;
SELECT public.load_companies_from_csv('/data/free_company_dataset.csv');