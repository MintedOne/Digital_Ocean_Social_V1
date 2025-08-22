'use client';

import { useState, useEffect } from 'react';
import { getUserDisplayName } from '@/lib/auth/user-display-utils';

interface UserAddress {
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  zipPostalCode?: string;
  country?: string;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: UserAddress;
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

interface LoginActivity {
  id: string;
  userEmail: string;
  userName?: string;
  userId?: string;
  type: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'profile_update';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

interface ActivityStatistics {
  totalActivities: number;
  todayLogins: number;
  failedLoginsToday: number;
  uniqueUsersToday: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'blocked' | 'admins' | 'standard-users' | 'activity-log'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Activity log state
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStatistics | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

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

  const loadActivityData = async () => {
    try {
      setActivityLoading(true);
      
      const response = await fetch('/api/admin/activity-log?includeStats=true&limit=50');
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data.activities);
        setActivityStats(data.data.statistics);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      showMessage('error', 'Failed to load activity data');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleCardClick = (tabKey: 'all' | 'pending' | 'approved' | 'blocked' | 'admins' | 'standard-users' | 'activity-log') => {
    setSelectedTab(tabKey);
    
    // Load activity data when switching to activity log tab
    if (tabKey === 'activity-log' && activities.length === 0) {
      loadActivityData();
    }
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

  const getActivityTypeBadge = (type: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (type) {
      case 'login_success':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'login_failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'logout':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'profile_update':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'password_reset':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case 'login_success':
        return 'Login Success';
      case 'login_failed':
        return 'Login Failed';
      case 'logout':
        return 'Logout';
      case 'profile_update':
        return 'Profile Update';
      case 'password_reset':
        return 'Password Reset';
      default:
        return type;
    }
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
          <button
            onClick={() => handleCardClick('activity-log')}
            className={`bg-white rounded-lg shadow p-4 border border-cyan-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 text-left ${
              selectedTab === 'activity-log' ? 'ring-2 ring-cyan-500 bg-cyan-50' : ''
            }`}
          >
            <div className="text-2xl font-bold text-cyan-600">
              {activityStats?.todayLogins || '...'}
            </div>
            <div className="text-sm text-gray-600">Activity Log</div>
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
              { key: 'activity-log', label: 'Activity Log', count: activities.length },
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

        {/* Content Section */}
        {selectedTab === 'activity-log' ? (
          // Activity Log Section
          <div className="p-6">
            {activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading activity data...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Activity Statistics */}
                {activityStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-700">{activityStats.totalActivities}</div>
                      <div className="text-sm text-gray-600">Total Activities</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">{activityStats.todayLogins}</div>
                      <div className="text-sm text-gray-600">Today's Logins</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-700">{activityStats.failedLoginsToday}</div>
                      <div className="text-sm text-gray-600">Failed Logins Today</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">{activityStats.uniqueUsersToday}</div>
                      <div className="text-sm text-gray-600">Unique Users Today</div>
                    </div>
                  </div>
                )}

                {/* Activity Log Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {activity.userName || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">{activity.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getActivityTypeBadge(activity.type)}>
                              {formatActivityType(activity.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(activity.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.ipAddress || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.details || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {activities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No activity records found.
                    </div>
                  )}
                </div>

                {/* Refresh Button */}
                <div className="flex justify-center">
                  <button
                    onClick={loadActivityData}
                    disabled={activityLoading}
                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {activityLoading ? '🔄 Loading...' : '🔄 Refresh Activity Log'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Users Table Section
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
                        {getUserDisplayName(user)}
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
        )}
      </div>
    </div>
  );
}