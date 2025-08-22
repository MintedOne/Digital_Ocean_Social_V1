'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'blocked';
}

interface UserStatistics {
  total: number;
  pending: number;
  approved: number;
  blocked: number;
  admins: number;
  users: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'blocked' | 'admins' | 'standard-users'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users and statistics
      const [usersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/statistics')
      ]);
      
      const usersData = await usersResponse.json();
      const statsData = await statsResponse.json();
      
      if (usersData.success) {
        setUsers(usersData.data);
      }
      
      if (statsData.success) {
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      showMessage('error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCardClick = (tabKey: 'all' | 'pending' | 'approved' | 'blocked' | 'admins' | 'standard-users') => {
    setSelectedTab(tabKey);
  };

  const handleUserAction = async (userId: string, action: 'approve' | 'block' | 'promote' | 'demote') => {
    try {
      setActionLoading(userId);
      
      const response = await fetch('/api/admin/user-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('success', result.message);
        await loadData(); // Reload data
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      showMessage('error', 'Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'admins') return user.role === 'admin';
    if (selectedTab === 'standard-users') return user.role === 'user';
    return user.status === selectedTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'blocked':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return role === 'admin' 
      ? `${baseClasses} bg-purple-100 text-purple-800`
      : `${baseClasses} bg-blue-100 text-blue-800`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => handleCardClick('all')}
            className={`bg-white rounded-lg shadow p-4 border border-blue-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${
              selectedTab === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </button>
          <button
            onClick={() => handleCardClick('pending')}
            className={`bg-white rounded-lg shadow p-4 border border-yellow-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${
              selectedTab === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''
            }`}
          >
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </button>
          <button
            onClick={() => handleCardClick('approved')}
            className={`bg-white rounded-lg shadow p-4 border border-green-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${
              selectedTab === 'approved' ? 'ring-2 ring-green-500 bg-green-50' : ''
            }`}
          >
            <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </button>
          <button
            onClick={() => handleCardClick('blocked')}
            className={`bg-white rounded-lg shadow p-4 border border-red-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${
              selectedTab === 'blocked' ? 'ring-2 ring-red-500 bg-red-50' : ''
            }`}
          >
            <div className="text-2xl font-bold text-red-600">{statistics.blocked}</div>
            <div className="text-sm text-gray-600">Blocked</div>
          </button>
          <button
            onClick={() => handleCardClick('admins')}
            className={`bg-white rounded-lg shadow p-4 border border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${
              selectedTab === 'admins' ? 'ring-2 ring-purple-500 bg-purple-50' : ''
            }`}
          >
            <div className="text-2xl font-bold text-purple-600">{statistics.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </button>
          <button
            onClick={() => handleCardClick('standard-users')}
            className={`bg-white rounded-lg shadow p-4 border border-blue-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${
              selectedTab === 'standard-users' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">{statistics.users}</div>
            <div className="text-sm text-gray-600">Standard Users</div>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'all', label: 'All Users', count: users.length },
              { key: 'pending', label: 'Pending', count: users.filter(u => u.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: users.filter(u => u.status === 'approved').length },
              { key: 'blocked', label: 'Blocked', count: users.filter(u => u.status === 'blocked').length },
              { key: 'admins', label: 'Admins', count: users.filter(u => u.role === 'admin').length },
              { key: 'standard-users', label: 'Standard Users', count: users.filter(u => u.role === 'user').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.displayName
                        }
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.phoneNumber ? (
                        <div className="text-xs text-gray-600">{user.phoneNumber}</div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No phone</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getRoleBadge(user.role)}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(user.status)}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {(user.status === 'pending' || user.status === 'blocked') && (
                      <button
                        onClick={() => handleUserAction(user.id, 'approve')}
                        disabled={actionLoading === user.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {actionLoading === user.id ? '...' : (user.status === 'blocked' ? 'Re-approve' : 'Approve')}
                      </button>
                    )}
                    
                    {user.status !== 'blocked' && user.role !== 'admin' && (
                      <button
                        onClick={() => handleUserAction(user.id, 'block')}
                        disabled={actionLoading === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {actionLoading === user.id ? '...' : 'Block'}
                      </button>
                    )}
                    
                    {user.role === 'user' && user.status === 'approved' && (
                      <button
                        onClick={() => handleUserAction(user.id, 'promote')}
                        disabled={actionLoading === user.id}
                        className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                      >
                        {actionLoading === user.id ? '...' : 'Promote'}
                      </button>
                    )}
                    
                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleUserAction(user.id, 'demote')}
                        disabled={actionLoading === user.id}
                        className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                      >
                        {actionLoading === user.id ? '...' : 'Demote'}
                      </button>
                    )}
                    
                    {user.status === 'blocked' && user.email !== 'ts@mintedyachts.com' && (
                      <button
                        onClick={() => handleUserAction(user.id, 'delete')}
                        disabled={actionLoading === user.id}
                        className="text-red-800 hover:text-red-900 disabled:opacity-50 font-semibold"
                      >
                        {actionLoading === user.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}