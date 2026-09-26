-- Grant API roles access to the linktree schema
GRANT USAGE ON SCHEMA linktree TO anon, authenticated, service_role;

-- Public read access for the public linktree page
GRANT SELECT ON linktree.links TO anon, authenticated;
GRANT SELECT ON linktree.profile TO anon, authenticated;

-- Full access for service_role (used by admin API routes)
GRANT ALL ON linktree.links TO service_role;
GRANT ALL ON linktree.profile TO service_role;

-- Write access for authenticated (belt-and-suspenders)
GRANT INSERT, UPDATE, DELETE ON linktree.links TO authenticated;
GRANT INSERT, UPDATE, DELETE ON linktree.profile TO authenticated;

-- Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA linktree TO anon, authenticated, service_role;
