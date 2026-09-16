-- V1's seeded BCrypt hash for the demo admin user does not actually verify
-- against the documented password 'Admin@12345' (confirmed: BCrypt.checkpw
-- returns false against the V1 hash) -- the literal never matched the
-- claimed plaintext, so the demo login credentials printed on the login
-- screen and in README.md have never worked. V1 is already applied and
-- checksummed wherever this service has run, so it is corrected here
-- rather than edited in place.
UPDATE users
SET password_hash = '$2a$12$eisx6OpI6FBeyaDmg.sctuaDLPhlgLO38w7zZpKOI6EcriH1uZK1u'
WHERE username = 'admin';
