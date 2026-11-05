-- Correct the event formatter; original immutable history remains intact.
DROP TRIGGER log_visual;
CREATE TRIGGER log_visual AFTER INSERT ON visual_finding BEGIN INSERT INTO history(kind,entity,detail,actor) VALUES('visual check',new.id,'Poster CTA for audit #'||new.audit||': '||coalesce(round(new.ratio,2)||':1','unmeasurable')||' - '||new.verdict,'Prometheus local contrast verifier'); END;
