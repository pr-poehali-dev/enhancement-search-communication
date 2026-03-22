
CREATE TABLE t_p69953026_enhancement_search_c.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT DEFAULT '',
  verified BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p69953026_enhancement_search_c.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p69953026_enhancement_search_c.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX sessions_token_idx ON t_p69953026_enhancement_search_c.sessions(token);
CREATE INDEX sessions_user_id_idx ON t_p69953026_enhancement_search_c.sessions(user_id);
