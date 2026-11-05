export function Hidden({
  values,
}: {
  values: Record<string, string | number>;
}) {
  return (
    <>
      {Object.entries(values).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}
export function Badge({ value }: { value: string }) {
  const good = ["Approved", "Supported"].includes(value);
  return (
    <span className={"badge " + (good ? "good" : "warn")}>
      <span aria-hidden="true">{good ? "✓" : "◷"}</span> {value}
    </span>
  );
}
