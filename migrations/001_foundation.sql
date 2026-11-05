CREATE TABLE campaign(id TEXT PRIMARY KEY, name TEXT NOT NULL, publication TEXT NOT NULL) STRICT;
CREATE TABLE asset(id TEXT PRIMARY KEY,campaign TEXT NOT NULL REFERENCES campaign, name TEXT NOT NULL, variant TEXT NOT NULL, channel TEXT NOT NULL) STRICT;
CREATE TABLE revision(id INTEGER PRIMARY KEY,asset TEXT NOT NULL REFERENCES asset, body TEXT NOT NULL) STRICT;
CREATE TABLE fact(id TEXT PRIMARY KEY,variant TEXT NOT NULL,label TEXT NOT NULL, UNIQUE(variant,label)) STRICT;
CREATE TABLE version(id INTEGER PRIMARY KEY,fact TEXT NOT NULL REFERENCES fact, wording TEXT NOT NULL, start TEXT NOT NULL CHECK(date(start,'+0 days') IS start AND length(start)=10), until TEXT CHECK(until IS NULL OR (date(until,'+0 days') IS until AND length(until)=10 AND until>start)), UNIQUE(fact,start)) STRICT;
-- Closing an open interval appends a boundary; no version cited by a reviewer is edited.
CREATE TABLE closure(version INTEGER PRIMARY KEY REFERENCES version, until TEXT NOT NULL CHECK(date(until,'+0 days') IS until AND length(until)=10)) STRICT;
CREATE VIEW periods AS SELECT v.id,v.fact,v.wording,v.start,coalesce(c.until,v.until) AS until FROM version v LEFT JOIN closure c ON c.version=v.id;
CREATE TRIGGER valid_closure BEFORE INSERT ON closure WHEN NOT EXISTS(SELECT 1 FROM version WHERE id=new.version AND until IS NULL AND start<new.until)
BEGIN SELECT raise(ABORT,'Invalid closing boundary'); END;
CREATE TRIGGER no_overlap BEFORE INSERT ON version WHEN EXISTS(SELECT 1 FROM periods WHERE fact=new.fact AND (until IS NULL OR until>new.start) AND (new.until IS NULL OR start<new.until))
BEGIN SELECT raise(ABORT,'Overlapping fact versions'); END;
CREATE TABLE audit(id INTEGER PRIMARY KEY,revision INTEGER NOT NULL REFERENCES revision,publication TEXT NOT NULL CHECK(date(publication,'+0 days') IS publication AND length(publication)=10)) STRICT;
CREATE TABLE finding(id INTEGER PRIMARY KEY,audit INTEGER NOT NULL REFERENCES audit,start INTEGER NOT NULL,stop INTEGER NOT NULL,quote TEXT NOT NULL,supported INTEGER NOT NULL CHECK(supported IN(0,1))) STRICT;
CREATE TABLE evidence(finding INTEGER NOT NULL REFERENCES finding,version INTEGER NOT NULL REFERENCES version,PRIMARY KEY(finding,version)) STRICT;
CREATE TABLE decision(id INTEGER PRIMARY KEY,audit INTEGER NOT NULL UNIQUE REFERENCES audit, outcome TEXT NOT NULL CHECK(outcome='Approved'), created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP) STRICT;
CREATE TRIGGER immutable_version_UPDATE BEFORE UPDATE ON version BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_version_DELETE BEFORE DELETE ON version BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_closure_UPDATE BEFORE UPDATE ON closure BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_closure_DELETE BEFORE DELETE ON closure BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_revision_UPDATE BEFORE UPDATE ON revision BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_revision_DELETE BEFORE DELETE ON revision BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_audit_UPDATE BEFORE UPDATE ON audit BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_audit_DELETE BEFORE DELETE ON audit BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_finding_UPDATE BEFORE UPDATE ON finding BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_finding_DELETE BEFORE DELETE ON finding BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_evidence_UPDATE BEFORE UPDATE ON evidence BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_evidence_DELETE BEFORE DELETE ON evidence BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_decision_UPDATE BEFORE UPDATE ON decision BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_decision_DELETE BEFORE DELETE ON decision BEGIN SELECT raise(ABORT,'Immutable history'); END;
