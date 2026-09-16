-- The frontend's Super Admin allowlist (Afifa, Satyam) previously existed
-- only as client-side identities in frontend/src/lib/auth.ts -- logging in
-- as either against this real backend correctly 401'd (no such user), and
-- the frontend's local-only fallback never engaged because a reachable
-- backend's genuine 401 is treated as a real rejection, not a network
-- failure. Seeding them as real accounts here, same pattern/hash as the
-- V1/V2 admin seed (password 'Admin@12345', verified BCrypt.checkpw).
INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, role_id, is_enabled, is_account_locked)
VALUES
    (
        'a0000000-0000-0000-0000-000000000002',
        'afifa',
        'afifasyed06@gmail.com',
        '$2a$12$eisx6OpI6FBeyaDmg.sctuaDLPhlgLO38w7zZpKOI6EcriH1uZK1u',
        'Afifa',
        'Syed',
        '+10000000001',
        'ROLE_ADMIN',
        TRUE,
        FALSE
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'satyam',
        'pandeysatyam1802@gmail.com',
        '$2a$12$eisx6OpI6FBeyaDmg.sctuaDLPhlgLO38w7zZpKOI6EcriH1uZK1u',
        'Satyam',
        'Pandey',
        '+10000000002',
        'ROLE_ADMIN',
        TRUE,
        FALSE
    )
ON CONFLICT (username) DO NOTHING;
