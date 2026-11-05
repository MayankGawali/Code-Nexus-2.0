-- Preserve legacy audits verbatim; their mode remains identifiable.
ALTER TABLE audit ADD COLUMN mode TEXT NOT NULL DEFAULT 'exact-phrase-v0';
ALTER TABLE finding ADD COLUMN verdict TEXT CHECK(verdict IN ('Supported','Contradicted','Insufficient evidence','Needs manual review'));
ALTER TABLE finding ADD COLUMN explanation TEXT;
ALTER TABLE finding ADD COLUMN suggestion TEXT;
ALTER TABLE finding ADD COLUMN extracted TEXT CHECK(extracted IS NULL OR json_valid(extracted));
