import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser, toggleUserActive } from '../../services/adminService';
import UserTable from './UserTable';
import CreateUser from './CreateUser';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, roleFilter],
    queryFn: () => getUsers({ page, limit: 10, role: roleFilter || undefined }),
  });

  async function handleDelete(id) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      queryClient.invalidateQueries(['admin-users']);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user.');
    }
  }

  async function handleToggleActive(id) {
    try {
      await toggleUserActive(id);
      queryClient.invalidateQueries(['admin-users']);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
          + Add User
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="input-field w-auto text-sm">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="coordinator">Coordinator</option>
          <option value="volunteer">Volunteer</option>
        </select>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load users." />}

      {data && (
        <>
          <div className="card p-0 overflow-hidden">
            <UserTable users={data.users} onDelete={handleDelete} onToggleActive={handleToggleActive} />
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
        <CreateUser onCreated={() => {
          setShowCreate(false);
          queryClient.invalidateQueries(['admin-users']);
        }} />
      </Modal>
    </div>
  );
}
