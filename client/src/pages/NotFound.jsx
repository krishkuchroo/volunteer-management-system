import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="text-gray-600">Page not found.</p>
        <Link to="/" className="btn-primary inline-block">Go Home</Link>
      </div>
    </div>
  );
}
