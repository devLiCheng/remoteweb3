-- ============================================================
-- RemoteWeb3 - Database Schema Extensions for Spider Data
-- Run after init.sql (local development)
-- ============================================================
USE remoteweb3;

-- Helper procedure to safely add columns
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
  IN table_name VARCHAR(128),
  IN column_name VARCHAR(128),
  IN column_def TEXT
)
BEGIN
  DECLARE col_count INT DEFAULT 0;
  SELECT COUNT(*) INTO col_count
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'remoteweb3'
    AND TABLE_NAME = table_name
    AND COLUMN_NAME = column_name;
  
  IF col_count = 0 THEN
    SET @sql = CONCAT('ALTER TABLE ', table_name, ' ADD COLUMN ', column_name, ' ', column_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- Add social media fields to companies
CALL add_column_if_not_exists('companies', 'twitter_url', 'VARCHAR(500) DEFAULT NULL AFTER website');
CALL add_column_if_not_exists('companies', 'linkedin_url', 'VARCHAR(500) DEFAULT NULL AFTER twitter_url');
CALL add_column_if_not_exists('companies', 'github_url', 'VARCHAR(500) DEFAULT NULL AFTER linkedin_url');
CALL add_column_if_not_exists('companies', 'discord_url', 'VARCHAR(500) DEFAULT NULL AFTER github_url');

-- Add extended job fields
CALL add_column_if_not_exists('jobs', 'department', 'VARCHAR(200) DEFAULT NULL AFTER experience_level');
CALL add_column_if_not_exists('jobs', 'visa_sponsorship', 'TINYINT(1) DEFAULT 0 AFTER department');

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Add more default tags for spider extraction (safe to run multiple times)
INSERT IGNORE INTO tags (name, slug, type) VALUES
('AI', 'ai', 'category'),
('Cosmos', 'cosmos', 'blockchain'),
('Polkadot', 'polkadot', 'blockchain'),
('Avalanche', 'avalanche', 'blockchain'),
('Arbitrum', 'arbitrum', 'blockchain'),
('Optimism', 'optimism', 'blockchain'),
('Aptos', 'aptos', 'blockchain'),
('Sui', 'sui', 'blockchain'),
('NEAR', 'near', 'blockchain'),
('StarkNet', 'starknet', 'blockchain'),
('Viem', 'viem', 'technology'),
('Vyper', 'vyper', 'skill'),
('Move', 'move', 'skill'),
('Cairo', 'cairo', 'skill'),
('Haskell', 'haskell', 'skill'),
('C++', 'cpp', 'skill'),
('Java', 'java', 'skill'),
('Trading', 'trading', 'category'),
('Mining', 'mining', 'category'),
('MEV', 'mev', 'category'),
('Oracles', 'oracles', 'category'),
('Cross-chain', 'cross-chain', 'category'),
('Staking', 'staking', 'category'),
('Lending', 'lending', 'category'),
('Yield', 'yield', 'category'),
('GameFi', 'gamefi', 'category'),
('Identity', 'identity', 'category'),
('Privacy', 'privacy', 'category'),
('ZK Proofs', 'zk-proofs', 'category'),
('MPC', 'mpc', 'category'),
('IPFS', 'ipfs', 'technology'),
('Distributed Systems', 'distributed-systems', 'category'),
('P2P', 'p2p', 'category'),
('Consensus', 'consensus', 'category'),
('Full Stack', 'full-stack', 'skill'),
('Backend', 'backend', 'skill'),
('Frontend', 'frontend', 'skill'),
('Mobile', 'mobile', 'skill'),
('iOS', 'ios', 'skill'),
('Android', 'android', 'skill'),
('Flutter', 'flutter', 'technology'),
('React Native', 'react-native', 'technology'),
('Foundry', 'foundry', 'technology');
