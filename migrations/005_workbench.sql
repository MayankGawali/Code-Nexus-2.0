ALTER TABLE history ADD COLUMN actor TEXT NOT NULL DEFAULT 'Unrecorded legacy actor';
CREATE TABLE poster_style(revision INTEGER PRIMARY KEY REFERENCES revision, foreground TEXT NOT NULL, background TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN('solid','unsupported'))) STRICT;
CREATE TABLE visual_finding(id INTEGER PRIMARY KEY, audit INTEGER NOT NULL UNIQUE REFERENCES audit, element TEXT NOT NULL, foreground TEXT NOT NULL, background TEXT NOT NULL, kind TEXT NOT NULL, ratio REAL, verdict TEXT NOT NULL CHECK(verdict IN('Supported','Contradicted','Needs manual review')), explanation TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'template-contrast-v1') STRICT;
-- Assign the explicit structured template to pre-existing print revisions.
INSERT INTO poster_style SELECT r.id,'#ffffff','#173b34','solid' FROM revision r JOIN asset a ON a.id=r.asset WHERE a.channel='Print';
-- Run the registered local contrast function; these are measured migration checks,
-- not a claim that the previous factual audit measured visual contrast.
INSERT INTO visual_finding(audit,element,foreground,background,kind,ratio,verdict,explanation,mode)
SELECT a.id,'poster-cta',s.foreground,s.background,s.kind,contrast_ratio(s.foreground,s.background),
CASE WHEN contrast_ratio(s.foreground,s.background)>=4.5 THEN 'Supported' ELSE 'Contradicted' END,
'Structured poster template measured during workbench migration; normal-size CTA requires 4.5:1.','template-contrast-v1 (migration)'
FROM audit a JOIN poster_style s ON s.revision=a.revision;
INSERT INTO history(kind,entity,detail,actor) SELECT 'visual check',id,'Measured poster CTA for audit #'||audit||': '||round(ratio,2)||':1  -  '||verdict,'Prometheus local contrast verifier (migration)' FROM visual_finding;
DROP TRIGGER log_source;
DROP TRIGGER log_revision;
DROP TRIGGER log_audit;
DROP TRIGGER log_override;
DROP TRIGGER log_approval;
DROP TRIGGER log_selection;
CREATE TRIGGER log_source AFTER INSERT ON source_change BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('source',new.version,'Source V'||new.version||': '||new.quote||'  -  '||new.reason,'Local demo reviewer'); END;
CREATE TRIGGER log_revision AFTER INSERT ON revision BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('revision',new.id,'Revision R'||new.id||' for '||new.asset||': '||new.body,'Local demo reviewer'); END;
CREATE TRIGGER log_audit AFTER INSERT ON audit BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('audit',new.id,'Audit #'||new.id||' for R'||new.revision||' on '||new.publication||' ('||new.mode||')','Prometheus local verifier'); END;
CREATE TRIGGER log_override AFTER INSERT ON finding_override BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('override',new.id,'Override #'||new.id||' for finding #'||new.finding||', R'||new.revision||': '||new.reason,'Local demo reviewer'); END;
CREATE TRIGGER log_approval AFTER INSERT ON decision BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('approval',new.id,'Approval #'||new.id||' for audit #'||new.audit,'Local demo reviewer'); END;
CREATE TRIGGER log_selection AFTER INSERT ON publication_selection BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('publication',new.id,new.asset||': selected publication '||new.day,'Local demo reviewer'); END;
CREATE TRIGGER log_visual AFTER INSERT ON visual_finding BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('visual check',new.id,'Poster CTA for audit #'||new.audit||': '||coalesce(round(new.ratio,2)||':1','unmeasurable')||'  -  '||new.verdict,'Prometheus local contrast verifier'); END;
CREATE TRIGGER immutable_poster_style_UPDATE BEFORE UPDATE ON poster_style BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_poster_style_DELETE BEFORE DELETE ON poster_style BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_visual_finding_UPDATE BEFORE UPDATE ON visual_finding BEGIN SELECT raise(ABORT,'Immutable history'); END;
CREATE TRIGGER immutable_visual_finding_DELETE BEFORE DELETE ON visual_finding BEGIN SELECT raise(ABORT,'Immutable history'); END;
