export function Label(props: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mt-6">
      <div className="font-bold mb-2">{props.label}</div>
      {!!props.description && (
        <p className="text-gray-600 mb-2">
          <small>{props.description}</small>
        </p>
      )}
      <div
        className="[&>input]:w-full [&>input]:border [&>input]:p-2
        [&>textarea]:w-full [&>textarea]:border [&>textarea]:p-2"
      >
        {props.children}
      </div>
    </label>
  );
}
