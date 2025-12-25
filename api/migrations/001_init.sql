-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(50) NOT NULL,
  date VARCHAR(10) NOT NULL,
  "startTime" VARCHAR(5) NOT NULL,
  "endTime" VARCHAR(5) NOT NULL,
  task TEXT NOT NULL,
  notes TEXT,
  "durationMinutes" INTEGER NOT NULL,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_userid ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_userid_date ON sessions("userId", date);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  "userId" VARCHAR(50) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  "updatedAt" BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  PRIMARY KEY ("userId", key)
);

-- Create index for settings
CREATE INDEX IF NOT EXISTS idx_settings_userid ON settings("userId");

