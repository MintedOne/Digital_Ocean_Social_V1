/**
 * Cascading Social Media Scheduler
 * Implements 7-day cascading pattern based on Claude Desktop specification
 * 
 * Core Logic:
 * - Find first day (today through +7 days) needing a post at current level
 * - If all 8 days are filled at current level, increment level and start from today
 * - Always prioritize NEAREST day to current date
 */

import { MetricoolCalendarReader, ScheduledPost } from './calendar-reader';

export interface TopicGroup {
  topic: string; // Yacht name or topic identifier
  postTime: Date;
  platforms: string[];
  postCount: number; // Number of platforms this topic posted to
}

export interface PostLevel {
  day: number; // Days from today (0-7)
  currentTopics: number; // Count of unique topics (not individual platform posts)
  targetLevel: number;
  needsTopics: boolean;
  existingTopics: TopicGroup[];
}

export interface CascadeDecision {
  day: number; // Days from today
  date: string; // ISO date string
  dateObj: Date;
  currentTopics: number; // Topics on this day (not individual posts)
  newLevel: number;
  action: string;
  isLevelIncrease: boolean;
  optimalTimeSlot: Date; // Calculated optimal time avoiding conflicts
  conflictAnalysis: {
    existingTimes: Date[];
    selectedSlot: number; // 0-4 (9AM, 12:30PM, 3:15PM, 5:45PM, 7:30PM)
    reasonForSlot: string;
  };
}

export class CascadingScheduler {
  private calendarReader: MetricoolCalendarReader;

  constructor(calendarReader: MetricoolCalendarReader) {
    this.calendarReader = calendarReader;
  }

  /**
   * Group posts by topic using precise time-based grouping
   * FIXED: Groups posts within 30 minutes as same topic (much more precise)
   * Each topic should be a cluster of platform posts scheduled close together
   */
  private groupPostsByTopic(posts: ScheduledPost[]): TopicGroup[] {
    if (posts.length === 0) return [];
    
    // Sort posts by time to group properly
    const sortedPosts = posts.sort((a, b) => {
      const timeA = new Date(a.publicationDate?.dateTime || 0).getTime();
      const timeB = new Date(b.publicationDate?.dateTime || 0).getTime();
      return timeA - timeB;
    });
    
    const topicGroups: TopicGroup[] = [];
    let currentGroup: TopicGroup | null = null;
    
    sortedPosts.forEach(post => {
      if (!post.publicationDate?.dateTime) return;
      
      const postTime = new Date(post.publicationDate.dateTime);
      const platforms = post.providers?.map(p => p.network) || [];
      
      // Check if this post should join the current group (within 30 minutes)
      if (currentGroup) {
        const timeDiff = Math.abs(postTime.getTime() - currentGroup.postTime.getTime());
        const minutesDiff = timeDiff / (1000 * 60);
        
        // FIXED: Much tighter grouping - 30 minutes instead of 3 hours
        if (minutesDiff <= 30) {
          // Add to current group
          platforms.forEach(platform => {
            if (!currentGroup!.platforms.includes(platform)) {
              currentGroup!.platforms.push(platform);
              currentGroup!.postCount++;
            }
          });
          return;
        }
      }
      
      // Start a new group
      currentGroup = {
        topic: `Topic-${postTime.toISOString().split('T')[0]}-${postTime.getHours()}h${postTime.getMinutes()}m`,
        postTime,
        platforms: [...platforms],
        postCount: platforms.length
      };
      
      topicGroups.push(currentGroup);
    });
    
    return topicGroups;
  }
  
  
  /**
   * Core cascading logic - find next posting action
   * NOW COUNTS TOPICS (grouped platform posts) NOT individual posts
   */
  async getNextAction(): Promise<CascadeDecision> {
    console.log('🌊 CASCADING SCHEDULER: Analyzing next posting action (TOPICS not posts)...');
    
    const today = new Date();
    const currentDay = 0; // Today is day 0
    
    // Get calendar data for next 8 days (today + 7 ahead) - FIXED: include the full 8th day
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + (8 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    const posts = await this.calendarReader.getScheduledPosts(startDate, endDate);
    
    // Group posts by topic for each day
    const topicsDict: Record<number, TopicGroup[]> = {};
    
    for (let day = 0; day <= 7; day++) {
      const checkDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      // Get posts for this specific day
      const dayPosts = posts.filter(post => {
        if (!post.publicationDate?.dateTime) return false;
        const postDate = post.publicationDate.dateTime.split('T')[0];
        return postDate === checkDateStr;
      });
      
      // Group day's posts by topic
      topicsDict[day] = this.groupPostsByTopic(dayPosts);
    }
    
    // Create topic counts (what the cascade logic uses)
    const topicCounts: Record<number, number> = {};
    for (let day = 0; day <= 7; day++) {
      topicCounts[day] = topicsDict[day]?.length || 0;
    }
    
    console.log('📊 Current TOPIC distribution (next 8 days):', topicCounts);
    console.log('🔍 Topic details by day:', Object.entries(topicsDict).reduce((acc, [day, topics]) => {
      acc[day] = topics.map(t => `${t.topic} (${t.platforms.length} platforms)`);
      return acc;
    }, {} as Record<string, string[]>));
    
    // Debug: Show actual dates for each day
    const dateMapping = {};
    for (let day = 0; day <= 7; day++) {
      const checkDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
      dateMapping[day] = checkDate.toISOString().split('T')[0];
    }
    console.log('📅 Day-to-Date mapping:', dateMapping);
    
    // FIXED: Implement correct cascading logic from Claude Desktop reference
    // Find current level (maximum topics across the 8-day window)
    const currentLevel = Math.max(...Object.values(topicCounts));
    console.log(`📈 Current topic level: ${currentLevel} topics/day maximum`);
    
    // Find FIRST day from current date that needs filling (Claude Desktop logic)
    console.log(`🔍 SEARCHING for FIRST day needing a topic at current level ${currentLevel}...`);
    let targetDay = -1;
    let targetTopics = 0;
    
    // Check if it's too late in the day to schedule for today (after 6:30 PM EDT)
    const now = new Date();
    const edtTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const currentHour = edtTime.getHours();
    const currentMinutes = edtTime.getMinutes();
    const tooLateForToday = currentHour > 18 || (currentHour === 18 && currentMinutes >= 30);
    const startDay = tooLateForToday ? 1 : currentDay; // Start from tomorrow if too late
    
    if (tooLateForToday) {
      console.log(`⏰ It's past 6:30 PM - skipping today and starting from tomorrow`);
    }
    
    for (let day = startDay; day <= currentDay + 7; day++) {
      const dayTopics = topicCounts[day] || 0;
      const dayDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      console.log(`📊 Day ${day} (${dayDate}): ${dayTopics}/${currentLevel} topics`);
      
      // Check if this day needs filling at current level
      if (dayTopics < currentLevel) {
        targetDay = day;
        targetTopics = dayTopics;
        console.log(`🎯 FOUND FIRST GAP: Day ${day} (${dayDate}) has ${dayTopics}/${currentLevel} topics`);
        break;
      }
    }
    
    // If all 8 days are filled at current level, increment level and start from appropriate day
    if (targetDay === -1) {
      const newLevel = currentLevel + 1;
      targetDay = startDay; // Use startDay (tomorrow if too late today)
      targetTopics = topicCounts[targetDay] || 0;
      console.log(`🚀 LEVEL UP! All 8 days filled at level ${currentLevel}, starting level ${newLevel} on day ${targetDay}`);
    }
    
    const targetDate = new Date(today.getTime() + (targetDay * 24 * 60 * 60 * 1000));
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const existingTopics = topicsDict[targetDay] || [];
    
    console.log(`✅ CASCADING DECISION: Day ${targetDay} (${targetDateStr}) gets topic #${targetTopics + 1}`);
    
    // Calculate optimal time slot avoiding conflicts
    const optimalTimeSlot = this.calculateOptimalTimeSlot(targetDate, existingTopics);
    
    return {
      day: targetDay,
      date: targetDate.toISOString().split('T')[0],
      dateObj: targetDate,
      currentTopics: targetTopics,
      newLevel: targetTopics + 1,
      action: `Post topic #${targetTopics + 1} on day ${targetDay} (first gap in cascade)`,
      isLevelIncrease: targetDay === currentDay && currentLevel > 1,
      optimalTimeSlot: optimalTimeSlot.time,
      conflictAnalysis: optimalTimeSlot.analysis
    };
  }

  /**
   * Calculate optimal time slot avoiding 2-hour conflicts
   * Uses 5 time slots: 9AM, 12:30PM, 3:15PM, 5:45PM, 7:30PM
   */
  private calculateOptimalTimeSlot(targetDate: Date, existingTopics: TopicGroup[]): {
    time: Date;
    analysis: {
      existingTimes: Date[];
      selectedSlot: number;
      reasonForSlot: string;
    };
  } {
    console.log(`⏰ Finding optimal time slot for ${targetDate.toISOString().split('T')[0]}...`);
    
    // Define the 5 time slots
    const timeSlots = [
      { hour: 9, minute: 0, name: '9:00 AM' },     // Slot 0
      { hour: 12, minute: 30, name: '12:30 PM' },  // Slot 1  
      { hour: 15, minute: 15, name: '3:15 PM' },   // Slot 2
      { hour: 17, minute: 45, name: '5:45 PM' },   // Slot 3
      { hour: 19, minute: 30, name: '7:30 PM' }    // Slot 4
    ];
    
    // Get existing topic times for this day
    const existingTimes = existingTopics.map(topic => topic.postTime);
    
    console.log(`🔍 Existing topics on ${targetDate.toISOString().split('T')[0]}:`, 
      existingTopics.map(t => `${t.topic} at ${t.postTime.toLocaleString('en-US', { 
        timeZone: 'America/New_York', 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`));
    
    // Get current time for comparison (must be at least 1 hour in the future)
    const now = new Date();
    const minFutureTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    // Check each slot for 2-hour conflicts AND ensure it's in the future
    let selectedSlot = -1;
    let reasonForSlot = '';
    
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      const slot = timeSlots[slotIndex];
      const slotTime = new Date(targetDate);
      slotTime.setHours(slot.hour, slot.minute, 0, 0);
      
      // Skip if slot is in the past (must be at least 1 hour in the future)
      if (slotTime < minFutureTime) {
        console.log(`⏭️ Slot ${slotIndex}: ${slot.name} is in the past or too soon`);
        continue;
      }
      
      // Check for 2-hour conflicts (±2 hours)
      const hasConflict = existingTimes.some(existingTime => {
        const timeDiff = Math.abs(slotTime.getTime() - existingTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff < 2;
      });
      
      if (!hasConflict) {
        selectedSlot = slotIndex;
        reasonForSlot = `No conflicts within 2 hours of ${slot.name}`;
        console.log(`✅ Selected slot ${slotIndex}: ${slot.name} - ${reasonForSlot}`);
        break;
      } else {
        console.log(`❌ Slot ${slotIndex}: ${slot.name} has conflict within 2 hours`);
      }
    }
    
    // If all slots have conflicts OR are in the past, handle fallback
    if (selectedSlot === -1) {
      console.log('⚠️ No ideal slots available - finding best alternative...');
      
      // First, check if today's slots are all in the past
      const allSlotsInPast = timeSlots.every(slot => {
        const slotTime = new Date(targetDate);
        slotTime.setHours(slot.hour, slot.minute, 0, 0);
        return slotTime < minFutureTime;
      });
      
      if (allSlotsInPast) {
        // If all today's slots are in the past, move to tomorrow
        console.log('📅 All slots today are in the past - moving to tomorrow');
        targetDate.setDate(targetDate.getDate() + 1);
        selectedSlot = 0; // Use first slot of tomorrow (9 AM)
        reasonForSlot = 'Moved to next day - all today slots were in the past';
      } else {
        // Find the slot with least conflicts that's still in the future
        let minConflicts = Infinity;
        let bestSlot = -1;
        
        for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
          const slot = timeSlots[slotIndex];
          const slotTime = new Date(targetDate);
          slotTime.setHours(slot.hour, slot.minute, 0, 0);
          
          // Skip if in the past
          if (slotTime < minFutureTime) continue;
          
          const conflicts = existingTimes.filter(existingTime => {
            const timeDiff = Math.abs(slotTime.getTime() - existingTime.getTime());
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            return hoursDiff < 2;
          }).length;
          
          if (conflicts < minConflicts) {
            minConflicts = conflicts;
            bestSlot = slotIndex;
          }
        }
        
        if (bestSlot === -1) {
          // Extreme edge case: move to tomorrow
          targetDate.setDate(targetDate.getDate() + 1);
          selectedSlot = 0;
          reasonForSlot = 'All future slots have conflicts - moved to next day';
        } else {
          selectedSlot = bestSlot;
          reasonForSlot = `Least conflicts (${minConflicts} within 2 hours) at ${timeSlots[bestSlot].name}`;
        }
      }
      
      console.log(`🔄 Fallback to slot ${selectedSlot}: ${reasonForSlot}`);
    }
    
    // Set the optimal time
    const optimalSlot = timeSlots[selectedSlot];
    const optimalTime = new Date(targetDate);
    optimalTime.setHours(optimalSlot.hour, optimalSlot.minute, 0, 0);
    
    console.log(`📅 OPTIMAL TIME SELECTED: ${optimalTime.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })}`);
    
    return {
      time: optimalTime,
      analysis: {
        existingTimes,
        selectedSlot,
        reasonForSlot
      }
    };
  }

  /**
   * Get optimal posting time based on cascade decision
   * Uses the new conflict-aware time slot calculation
   */
  calculateOptimalPostingTime(decision: CascadeDecision): Date {
    console.log(`⏰ Calculating optimal time for cascade decision:`, {
      day: decision.day,
      date: decision.date,
      currentTopics: decision.currentTopics,
      newLevel: decision.newLevel
    });
    
    // Return the pre-calculated optimal time slot
    return decision.optimalTimeSlot;
  }

  /**
   * Visualize the cascading pattern for next 8 days (TOPICS not posts)
   */
  async visualizeCascadePattern(): Promise<{
    pattern: Array<{
      day: number;
      date: string;
      currentTopics: number;
      dayName: string;
      topicDetails: Array<{
        topic: string;
        platforms: string[];
        time: string;
      }>;
    }>;
    nextAction: CascadeDecision;
    summary: string;
  }> {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + (8 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    const posts = await this.calendarReader.getScheduledPosts(startDate, endDate);
    const nextAction = await this.getNextAction();
    
    const pattern = [];
    
    for (let day = 0; day <= 7; day++) {
      const checkDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const dayPosts = posts.filter(post => {
        if (!post.publicationDate?.dateTime) return false;
        const postDate = post.publicationDate.dateTime.split('T')[0];
        return postDate === checkDateStr;
      });
      
      // Group posts by topic for this day
      const topicGroups = this.groupPostsByTopic(dayPosts);
      
      pattern.push({
        day,
        date: checkDateStr,
        currentTopics: topicGroups.length,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDate.getDay()],
        topicDetails: topicGroups.map(topic => ({
          topic: topic.topic,
          platforms: topic.platforms,
          time: topic.postTime.toLocaleString('en-US', { 
            timeZone: 'America/New_York',
            hour: 'numeric',
            minute: '2-digit'
          })
        }))
      });
    }
    
    const currentLevel = Math.max(...pattern.map(p => p.currentTopics));
    const filledDays = pattern.filter(p => p.currentTopics >= currentLevel).length;
    
    let summary = `📊 Current Level: ${currentLevel} topics/day | `;
    summary += `Filled Days: ${filledDays}/8 | `;
    summary += `Next: ${nextAction.action}`;
    
    return {
      pattern,
      nextAction,
      summary
    };
  }

  /**
   * Get scheduling times for multiple platforms with proper staggering
   * Based on cascade decision timing
   */
  getStaggeredPlatformTimes(baseTime: Date, platforms: string[]): Record<string, Date> {
    const times: Record<string, Date> = {};
    
    platforms.forEach((platform, index) => {
      // Stagger by 5-minute intervals between platforms
      const staggeredTime = new Date(baseTime.getTime() + (index * 5 * 60 * 1000));
      times[platform] = staggeredTime;
    });
    
    console.log('🕒 Staggered platform scheduling times:', 
      Object.entries(times).reduce((acc, [platform, time]) => {
        acc[platform] = time.toLocaleString('en-US', { timeZone: 'America/New_York' });
        return acc;
      }, {} as Record<string, string>)
    );
    
    return times;
  }
}

/**
 * Example execution simulation (for testing/debugging)
 */
export async function simulateCascadeExecution(scheduler: CascadingScheduler, days: number = 15) {
  console.log(`🎮 SIMULATING CASCADE EXECUTION for ${days} days...`);
  
  const simulation = [];
  
  for (let simDay = 1; simDay <= days; simDay++) {
    console.log(`\n--- Day ${simDay} Simulation ---`);
    
    const action = await scheduler.getNextAction();
    const visualization = await scheduler.visualizeCascadePattern();
    
    simulation.push({
      day: simDay,
      action: action.action,
      pattern: visualization.pattern.map(p => `Day ${p.day}: ${p.currentPosts} posts`).join(', '),
      summary: visualization.summary
    });
    
    console.log(`Day ${simDay}: ${action.action}`);
    console.log(`Pattern: ${visualization.summary}`);
  }
  
  return simulation;
}