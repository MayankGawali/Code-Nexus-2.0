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
  return (
    <span className={"badge " + (value === "Approved" ? "good" : "warn")}>
      {value}
    </span>
  );
}
