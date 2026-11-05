export function recordedTime(event?: { created: string; imported: number }) {
  return event?.imported
    ? "Imported record; original event time unavailable"
    : event?.created
      ? event.created + " UTC"
      : "Original event time not recorded";
}
export function History({
  events,
}: {
  events: {
    id: number;
    kind: string;
    detail: string;
    created: string;
    imported: number;
    actor?: string;
  }[];
}) {
  return (
    <section className="history-log">
      <div className="section-heading">
        <h2>Workspace history</h2>
        <span>Chronological · oldest first</span>
      </div>
      {!events.length && (
        <p className="empty card">
          No activity yet. Your review actions will appear here.
        </p>
      )}
      <ol className="timeline">
        {events.map((e) => (
          <li key={e.id}>
            <span className="timeline-dot" aria-hidden="true" />
            <div className="timeline-meta">
              <strong>{e.actor ?? "Unrecorded legacy actor"}</strong>
              <span>
                {e.kind} · {e.imported ? "Imported on " : ""}
                {e.created} UTC
              </span>
            </div>
            <p>{e.detail}</p>
            {e.imported === 1 && (
              <small>
                Imported history: the original event time may be unavailable.
              </small>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
