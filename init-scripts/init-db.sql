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


CREATE TABLE IF NOT EXISTS Company(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    domains JSONB NOT NULL,
    description TEXT,
    taxonomies_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAXONOMY(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAXONOMY_RELATIONSHIP(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    taxonomy_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES COMPANY(id),
    FOREIGN KEY (taxonomy_id) REFERENCES TAXONOMY(id)
);

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
    zip INTEGER,
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

-- User sessions table for token-based auth
CREATE TABLE IF NOT EXISTS user_session(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES custom_auth_user(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
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



-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for Company table
CREATE TRIGGER update_company_updated_at 
    BEFORE UPDATE ON Company 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for OFFICE table
CREATE TRIGGER update_office_updated_at 
    BEFORE UPDATE ON OFFICE 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for PERSON table
CREATE TRIGGER update_person_updated_at 
    BEFORE UPDATE ON PERSON 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for custom_auth_user table
CREATE TRIGGER update_custom_auth_user_updated_at 
    BEFORE UPDATE ON custom_auth_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for oauth_account table
CREATE TRIGGER update_oauth_account_updated_at 
    BEFORE UPDATE ON oauth_account
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for TAXONOMY table
CREATE TRIGGER update_taxonomy_updated_at 
    BEFORE UPDATE ON TAXONOMY 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for TAXONOMY_RELATIONSHIP table
CREATE TRIGGER update_taxonomy_relationship_updated_at 
    BEFORE UPDATE ON TAXONOMY_RELATIONSHIP 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for USER_DATA table
CREATE TRIGGER update_user_data_updated_at 
    BEFORE UPDATE ON USER_DATA 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for USER_WORLD table
CREATE TRIGGER update_user_world_updated_at 
    BEFORE UPDATE ON USER_WORLD 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();