export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
      {message}
    </div>
  );
}
