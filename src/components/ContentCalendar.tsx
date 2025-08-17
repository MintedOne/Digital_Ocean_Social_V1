/**
 * Content Calendar Component - 4-Week Display
 * Shows scheduled posts from Metricool for intelligent planning
 */

'use client';

import { useState, useEffect } from 'react';
import { PLATFORM_NAMES, PLATFORM_ICONS } from '@/lib/metricool/config';

interface ScheduledPost {
  id: string;
  publicationDate: {
    dateTime: string;
    timezone: string;
  };
  text: string;
  providers: Array<{
    network: string;
    status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  }>;
  autoPublish: boolean;
  media?: string[];
}

interface CalendarAnalysis {
  totalScheduled: number;
  dateRange: { start: string; end: string };
  platformBreakdown: Record<string, number>;
  dailyBreakdown: Record<string, number>;
  timeSlots: Record<string, number>;
  recommendations: string[];
}

interface CalendarData {
  posts: ScheduledPost[];
  analysis: CalendarAnalysis;
  optimalTime: string;
  source: string;
}

interface ContentCalendarProps {
  onCalendarLoad?: (data: CalendarData) => void;
  refreshTrigger?: number; // Add trigger to force refresh
}

type CalendarView = 'week' | 'month' | 'quarter';

export default function ContentCalendar({ onCalendarLoad, refreshTrigger }: ContentCalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [componentKey, setComponentKey] = useState(0); // For forcing complete re-render

  // Load calendar data
  useEffect(() => {
    loadCalendarData();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('📅 Calendar refresh triggered by parent component - FORCING FRESH DATA');
      // 🔄 Force complete component reset
      setComponentKey(prev => prev + 1);
      setCalendarData(null);
      loadCalendarData(true); // Force fresh data after posting
    }
  }, [refreshTrigger]);

  const loadCalendarData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      
      // 🔄 FORCE STATE RESET when refreshing to ensure clean state
      if (forceRefresh) {
        setCalendarData(null); // Clear existing data first
        console.log('🔄 FORCE REFRESH: Clearing existing calendar state');
      }
      
      const refreshIndicator = forceRefresh ? ' (FORCE REFRESH)' : '';
      console.log(`📅 Loading calendar data${refreshIndicator}...`);

      // 🚫 AGGRESSIVE CACHE-BUSTING for force refresh
      const baseUrl = forceRefresh ? '/api/metricool/calendar?force=true' : '/api/metricool/calendar';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const url = forceRefresh ? `${baseUrl}&_t=${timestamp}&_r=${randomId}` : baseUrl;
      
      const fetchOptions = {
        method: 'GET',
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
          'If-None-Match': '"0"'
        } : {}
      };
      
      console.log(`📡 FETCH REQUEST:`, { url, headers: fetchOptions.headers, timestamp });
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      
      if (data.success || data.posts !== undefined) {
        setCalendarData(data);
        onCalendarLoad?.(data);
        console.log(`✅ Calendar loaded: ${data.posts.length} posts, source: ${data.source}`);
      } else {
        throw new Error(data.error || 'Failed to load calendar');
      }
    } catch (err) {
      console.error('❌ Calendar load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
      
      // Set fallback data
      const fallbackData: CalendarData = {
        posts: [],
        analysis: {
          totalScheduled: 0,
          dateRange: { start: new Date().toISOString().split('T')[0], end: new Date(Date.now() + 28*24*60*60*1000).toISOString().split('T')[0] },
          platformBreakdown: {},
          dailyBreakdown: {},
          timeSlots: {},
          recommendations: ['📅 Calendar unavailable - using conservative scheduling']
        },
        optimalTime: new Date(Date.now() + 24*60*60*1000).toISOString(),
        source: 'Error fallback'
      };
      setCalendarData(fallbackData);
      onCalendarLoad?.(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar grid with proper date alignment and selectable views
  const generateCalendarWeeks = () => {
    if (!calendarData) return [];

    const today = new Date();
    const weeks = [];
    
    // Calculate weeks to show based on view
    const weeksToShow = calendarView === 'week' ? 1 : calendarView === 'month' ? 4 : 12;
    
    // Start from beginning of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let week = 0; week < weeksToShow; week++) {
      const weekDays = [];
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + (week * 7) + day);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Find posts for this date
        const dayPosts = calendarData.posts.filter(post => 
          post.publicationDate?.dateTime?.startsWith(dateStr)
        );
        
        const isToday = dateStr === today.toISOString().split('T')[0];
        const postCount = calendarData.analysis.dailyBreakdown[dateStr] || 0;
        
        // 🔍 DIAGNOSTIC: Log August 18th data for debugging
        if (dateStr === '2025-08-18') {
          console.log(`🔍 CALENDAR DEBUG - Aug 18th:`, {
            dayPosts_length: dayPosts.length,
            postCount_from_backend: postCount,
            dailyBreakdown_raw: calendarData.analysis.dailyBreakdown['2025-08-18'],
            timestamp: new Date().toISOString(),
            posts_sample: dayPosts.slice(0, 3).map(p => ({
              time: p.publicationDate?.dateTime,
              networks: p.providers?.map(pr => pr.network)
            }))
          });
        }
        
        weekDays.push({
          date: currentDate,
          dateStr,
          posts: dayPosts,
          isToday,
          postCount,
          isCurrentMonth: currentDate.getMonth() === today.getMonth()
        });
      }
      
      weeks.push(weekDays);
    }
    
    return weeks;
  };

  const getPlatformIcon = (network: string) => {
    const normalizedNetwork = network.toLowerCase();
    const iconPath = PLATFORM_ICONS[normalizedNetwork as keyof typeof PLATFORM_ICONS];
    
    if (iconPath) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d={iconPath} />
        </svg>
      );
    }
    
    // Fallback icon
    return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
  };

  const getPlatformColor = (network: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-blue-500 text-white',
      facebook: 'bg-blue-600 text-white',
      instagram: 'bg-pink-500 text-white',
      linkedin: 'bg-blue-700 text-white',
      tiktok: 'bg-black text-white',
      gmb: 'bg-green-600 text-white'
    };
    
    return colors[network.toLowerCase()] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-purple-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-lg font-semibold text-purple-800">Loading Calendar...</h3>
        </div>
        <div className="text-purple-600">Fetching scheduled posts from Metricool...</div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Calendar Unavailable</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadCalendarData}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  const weeks = generateCalendarWeeks();

  return (
    <div key={componentKey} className="bg-white rounded-lg border border-purple-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-purple-800">🌊 4-Week Rolling Cascade</h3>
          <p className="text-purple-600 text-sm">
            {calendarData.analysis.totalScheduled} scheduled posts • Source: {calendarData.source}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Selection */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {([['week', '1W'], ['month', '1M'], ['quarter', '3M']] as const).map(([view, label]) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  calendarView === view
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={loadCalendarData}
            className="text-purple-600 hover:text-purple-800 text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        {/* Days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar weeks */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`min-h-[80px] border rounded-lg p-2 ${
                    day.isToday 
                      ? 'bg-purple-50 border-purple-300' 
                      : day.postCount > 0 
                        ? 'bg-blue-50 border-blue-200' 
                        : day.isCurrentMonth
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-gray-25 border-gray-100 opacity-50'
                  }`}
                >
                  {/* Date */}
                  <div className={`text-sm font-medium mb-1 ${
                    day.isToday ? 'text-purple-800' : 'text-gray-600'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Post count badge */}
                  {day.postCount > 0 && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                      {day.postCount} post{day.postCount > 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {/* Platform icons */}
                  {day.posts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {day.posts.slice(0, 3).map((post, postIndex) => (
                        <div key={postIndex} className="flex space-x-1">
                          {post.providers?.slice(0, 2).map((provider, providerIndex) => (
                            <div
                              key={providerIndex}
                              className={`p-1 rounded ${getPlatformColor(provider.network)}`}
                              title={`${provider.network} - ${provider.status}`}
                            >
                              {getPlatformIcon(provider.network)}
                            </div>
                          ))}
                        </div>
                      ))}
                      {day.posts.length > 3 && (
                        <div className="text-xs text-gray-500">+{day.posts.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Analysis & Recommendations */}
      <div className="border-t border-purple-200 pt-4">
        <h4 className="font-medium text-purple-800 mb-3">📊 Smart Scheduling Insights</h4>
        
        {/* Platform breakdown */}
        {Object.keys(calendarData.analysis.platformBreakdown).length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Platform Distribution:</h5>
            <div className="flex flex-wrap gap-2">
              {Object.entries(calendarData.analysis.platformBreakdown).map(([platform, count]) => (
                <div key={platform} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
                  {getPlatformIcon(platform)}
                  <span className="text-sm text-gray-700">
                    {PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES] || platform}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h5>
          <div className="space-y-1">
            {calendarData.analysis.recommendations.map((rec, index) => (
              <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                {rec}
              </div>
            ))}
          </div>
        </div>

        {/* Optimal posting time */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm font-medium text-green-800">⏰ Suggested Next Post Time:</div>
          <div className="text-sm text-green-700">
            {new Date(calendarData.optimalTime).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </div>
        </div>
      </div>
    </div>
  );
}