import { formatDate, capitalizeFirst } from '../../utils/formatters';

export default function UserTable({ users, onToggleActive, onDelete }) {
  if (!users.length) {
    return <p className="text-gray-500 text-sm text-center py-8">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Joined</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{user.first_name} {user.last_name}</td>
              <td className="px-4 py-3 text-gray-600">{user.email}</td>
              <td className="px-4 py-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                  {capitalizeFirst(user.role)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => onToggleActive(user.id)}
                  className={`text-xs px-2 py-1 rounded ${user.is_active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => onDelete(user.id)}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
