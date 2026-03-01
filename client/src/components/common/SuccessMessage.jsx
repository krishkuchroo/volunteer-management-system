export default function SuccessMessage({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
      {message}
    </div>
  );
}
