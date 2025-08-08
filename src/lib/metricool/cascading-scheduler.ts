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
   * Group posts by topic using simple post count logic
   * 6 posts = 1 topic, 12+ posts = 2 topics (much more reliable)
   * Groups posts within 3-hour windows as same topic
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
      
      // Check if this post should join the current group (within 3 hours)
      if (currentGroup) {
        const timeDiff = Math.abs(postTime.getTime() - currentGroup.postTime.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff <= 3) {
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
        topic: `Topic-${postTime.toISOString().split('T')[0]}`,
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
    
    // Get calendar data for next 8 days (today + 7 ahead)
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
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
    
    // Find current level across all 8 days
    const currentLevel = Math.max(...Object.values(topicCounts));
    console.log(`📈 Current topic level: ${currentLevel} topics/day maximum`);
    
    // Find first day needing a topic at current level
    console.log(`🔍 SEARCHING for gaps at level ${currentLevel}...`);
    for (let day = currentDay; day <= currentDay + 7; day++) {
      const dayTopics = topicCounts[day] || 0;
      const dayDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      console.log(`📊 Day ${day} (${dayDate}): ${dayTopics} topics, need ${currentLevel}`);
      
      if (dayTopics < currentLevel) {
        // Found a gap! Schedule new topic at current level
        const targetDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
        const existingTopics = topicsDict[day] || [];
        
        console.log(`✅ FOUND TOPIC GAP: Day ${day} (${dayDate}) has ${dayTopics}/${currentLevel} topics - scheduling topic #${dayTopics + 1}`);
        
        // Calculate optimal time slot avoiding conflicts
        const optimalTimeSlot = this.calculateOptimalTimeSlot(targetDate, existingTopics);
        
        return {
          day,
          date: targetDate.toISOString().split('T')[0],
          dateObj: targetDate,
          currentTopics: dayTopics,
          newLevel: currentLevel,
          action: `Post topic #${dayTopics + 1} on day ${day} (${currentLevel} topics/day level)`,
          isLevelIncrease: false,
          optimalTimeSlot: optimalTimeSlot.time,
          conflictAnalysis: optimalTimeSlot.analysis
        };
      }
    }
    
    // All 8 days are filled at current level - increment level!
    const newLevel = currentLevel + 1;
    const targetDate = new Date(today); // Start from today at new level
    const existingTopics = topicsDict[currentDay] || [];
    
    console.log(`🚀 LEVEL UP! All 8 days filled at ${currentLevel} topics - increasing to level ${newLevel}`);
    
    const optimalTimeSlot = this.calculateOptimalTimeSlot(targetDate, existingTopics);
    
    return {
      day: currentDay,
      date: targetDate.toISOString().split('T')[0],
      dateObj: targetDate,
      currentTopics: topicCounts[currentDay] || 0,
      newLevel,
      action: `Increase to ${newLevel} topics/day, start at day ${currentDay}`,
      isLevelIncrease: true,
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
    
    // Check each slot for 2-hour conflicts
    let selectedSlot = -1;
    let reasonForSlot = '';
    
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      const slot = timeSlots[slotIndex];
      const slotTime = new Date(targetDate);
      slotTime.setHours(slot.hour, slot.minute, 0, 0);
      
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
    
    // If all slots have conflicts, use the slot with least conflicts
    if (selectedSlot === -1) {
      console.log('⚠️ All slots have conflicts - finding least conflicted slot...');
      
      let minConflicts = Infinity;
      let bestSlot = 0;
      
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const slot = timeSlots[slotIndex];
        const slotTime = new Date(targetDate);
        slotTime.setHours(slot.hour, slot.minute, 0, 0);
        
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
      
      selectedSlot = bestSlot;
      reasonForSlot = `Least conflicts (${minConflicts} within 2 hours) at ${timeSlots[bestSlot].name}`;
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
    const endDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
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