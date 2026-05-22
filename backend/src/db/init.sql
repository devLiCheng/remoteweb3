-- RemoteWeb3 - Database Initialization Script
-- MySQL 8.0+
-- Note: Database is auto-created by MYSQL_DATABASE env var in Docker

-- ============================================================
-- Companies table
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  logo_url VARCHAR(500) DEFAULT NULL,
  website VARCHAR(500) DEFAULT NULL,
  twitter_url VARCHAR(500) DEFAULT NULL,
  linkedin_url VARCHAR(500) DEFAULT NULL,
  github_url VARCHAR(500) DEFAULT NULL,
  discord_url VARCHAR(500) DEFAULT NULL,
  description TEXT,
  industry VARCHAR(100) DEFAULT NULL,
  company_size VARCHAR(50) DEFAULT NULL,
  headquarters VARCHAR(255) DEFAULT NULL,
  founded_year INT DEFAULT NULL,
  source_site VARCHAR(100) DEFAULT NULL,
  source_url VARCHAR(500) DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companies_name (name),
  INDEX idx_companies_source (source_site),
  INDEX idx_companies_verified (is_verified)
) ENGINE=InnoDB;

-- ============================================================
-- Jobs table
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  company_id INT NOT NULL,
  location VARCHAR(500) DEFAULT NULL,
  city VARCHAR(200) DEFAULT NULL,
  state VARCHAR(200) DEFAULT NULL,
  country VARCHAR(200) DEFAULT NULL,
  is_remote TINYINT(1) DEFAULT 0,
  salary_min DECIMAL(12,2) DEFAULT NULL,
  salary_max DECIMAL(12,2) DEFAULT NULL,
  salary_currency VARCHAR(10) DEFAULT 'USD',
  salary_period VARCHAR(20) DEFAULT 'year',
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  job_type ENUM('full-time','part-time','contract','internship','freelance') DEFAULT 'full-time',
  experience_level ENUM('entry','mid','senior','lead','executive') DEFAULT NULL,
  department VARCHAR(200) DEFAULT NULL,
  visa_sponsorship TINYINT(1) DEFAULT 0,
  application_url VARCHAR(1000) DEFAULT NULL,
  source_site VARCHAR(100) NOT NULL,
  source_url VARCHAR(1000) DEFAULT NULL,
  source_id VARCHAR(255) DEFAULT NULL,
  posted_date DATETIME DEFAULT NULL,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_jobs_title (title),
  INDEX idx_jobs_company (company_id),
  INDEX idx_jobs_location (is_remote, country, city),
  INDEX idx_jobs_salary (salary_min, salary_max),
  INDEX idx_jobs_source (source_site),
  INDEX idx_jobs_posted (posted_date),
  INDEX idx_jobs_active (is_active),
  INDEX idx_jobs_type (job_type),
  INDEX idx_jobs_level (experience_level)
) ENGINE=InnoDB;

-- ============================================================
-- Tags table (skills, technologies, categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('skill','technology','category','role','blockchain') DEFAULT 'skill',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tags_type (type),
  INDEX idx_tags_slug (slug)
) ENGINE=InnoDB;

-- ============================================================
-- Job-Tags junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS job_tags (
  job_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (job_id, tag_id),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  INDEX idx_job_tags_tag (tag_id)
) ENGINE=InnoDB;

-- ============================================================
-- Job categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id INT DEFAULT NULL,
  icon VARCHAR(50) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_categories (
  job_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (job_id, category_id),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_job_categories_cat (category_id)
) ENGINE=InnoDB;

-- ============================================================
-- Users table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  role ENUM('candidate','employer','admin') DEFAULT 'candidate',
  oauth_provider VARCHAR(50) DEFAULT NULL,
  oauth_id VARCHAR(255) DEFAULT NULL,
  wallet_address VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_wallet (wallet_address)
) ENGINE=InnoDB;

-- ============================================================
-- Saved jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, job_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Applications tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  job_id INT NOT NULL,
  status ENUM('viewed','applied','interviewing','offered','rejected','withdrawn') DEFAULT 'viewed',
  source_click VARCHAR(100) DEFAULT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_applications_job (job_id),
  INDEX idx_applications_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- SEO metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS seo_meta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_path VARCHAR(500) NOT NULL UNIQUE,
  title_zh VARCHAR(200) DEFAULT NULL,
  title_en VARCHAR(200) DEFAULT NULL,
  description_zh TEXT,
  description_en TEXT,
  keywords VARCHAR(500) DEFAULT NULL,
  og_image VARCHAR(500) DEFAULT NULL,
  canonical_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_path (page_path)
) ENGINE=InnoDB;

-- ============================================================
-- Default categories
-- ============================================================
INSERT IGNORE INTO categories (name, slug, icon, sort_order) VALUES
('Engineering', 'engineering', 'code', 1),
('Design', 'design', 'palette', 2),
('Marketing', 'marketing', 'megaphone', 3),
('Product', 'product', 'box', 4),
('Business Development', 'business-development', 'trending-up', 5),
('Operations', 'operations', 'settings', 6),
('Legal', 'legal', 'scale', 7),
('Finance', 'finance', 'dollar-sign', 8),
('Community', 'community', 'users', 9),
('Customer Support', 'customer-support', 'headphones', 10),
('Data & Analytics', 'data-analytics', 'bar-chart', 11),
('Writing & Content', 'writing-content', 'pen-tool', 12),
('Human Resources', 'human-resources', 'user-plus', 13),
('Sales', 'sales', 'target', 14);

-- ============================================================
-- Default tags
-- ============================================================
INSERT IGNORE INTO tags (name, slug, type) VALUES
('Solidity', 'solidity', 'skill'),
('Rust', 'rust', 'skill'),
('Go', 'go', 'skill'),
('TypeScript', 'typescript', 'skill'),
('JavaScript', 'javascript', 'skill'),
('Python', 'python', 'skill'),
('React', 'react', 'technology'),
('Node.js', 'nodejs', 'technology'),
('Next.js', 'nextjs', 'technology'),
('Ethereum', 'ethereum', 'blockchain'),
('Solana', 'solana', 'blockchain'),
('Polygon', 'polygon', 'blockchain'),
('Bitcoin', 'bitcoin', 'blockchain'),
('DeFi', 'defi', 'category'),
('NFT', 'nft', 'category'),
('DAO', 'dao', 'category'),
('Layer 2', 'layer-2', 'category'),
('Zero Knowledge', 'zero-knowledge', 'category'),
('Smart Contracts', 'smart-contracts', 'skill'),
('Web3.js', 'web3js', 'technology'),
('Ethers.js', 'ethersjs', 'technology'),
('AWS', 'aws', 'technology'),
('Docker', 'docker', 'technology'),
('Kubernetes', 'kubernetes', 'technology'),
('GraphQL', 'graphql', 'technology'),
('AI/ML', 'ai-ml', 'category'),
('Gaming', 'gaming', 'category'),
('Metaverse', 'metaverse', 'category'),
('Wallet', 'wallet', 'category'),
('Security', 'security', 'category'),
('Remote', 'remote', 'role');
