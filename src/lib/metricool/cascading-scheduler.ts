/**
 * Cascading Social Media Scheduler
 * Implements CASCADE PROGRESSION pattern for optimal post distribution
 * 
 * Core Logic:
 * - Dynamic window: Starts at 14 days, expands to 21, 28, 35 days if needed
 * - CASCADE PROGRESSION: Brings all weeks to minimum level + 1 before any week advances further
 * - Priority 1: Find minimum topic level across all days
 * - Priority 2: Fill days at minimum level, prioritizing earlier weeks
 * - Never extends to new weeks before doubling/tripling earlier weeks
 * - Prevents clustering by ensuring proper cascade order
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
   * Check if there are empty days in the given window
   */
  private async hasEmptyDaysInWindow(posts: ScheduledPost[], today: Date, windowSize: number): Promise<boolean> {
    const edtTime = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const currentHour = edtTime.getHours();
    const tooLateForToday = currentHour >= 10;
    const startDay = tooLateForToday ? 1 : 0;
    
    for (let day = startDay; day < windowSize; day++) {
      const checkDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const dayPosts = posts.filter(post => {
        if (!post.publicationDate?.dateTime) return false;
        const postDate = post.publicationDate.dateTime.split('T')[0];
        return postDate === checkDateStr;
      });
      
      const dayTopics = this.groupPostsByTopic(dayPosts);
      if (dayTopics.length === 0) {
        console.log(`🎯 Found empty day at day ${day} (${checkDateStr})`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Core cascading logic - find next posting action
   * IMPLEMENTS TRUE CASCADE: Fills weeks in proper cascade order
   * Priority: Week 1 → Week 2 → Week 3 → THEN double Week 1 → double Week 2 → etc.
   */
  async getNextAction(): Promise<CascadeDecision> {
    console.log('🌊 CASCADING SCHEDULER: Analyzing next posting action (TRUE CASCADE LOGIC)...');
    
    const today = new Date();
    const currentDay = 0; // Today is day 0
    
    // Start with 14-day window, expand if needed to find empty days
    let windowSize = 14;
    let foundEmptyDay = false;
    let posts: ScheduledPost[] = [];
    
    console.log('🔍 SEARCHING for empty days with expanding window...');
    
    // Keep expanding window until we find an empty day or reach reasonable limit
    while (!foundEmptyDay && windowSize <= 35) { // Max 5 weeks
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + (windowSize * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      console.log(`📊 Checking ${windowSize}-day window: ${startDate} to ${endDate}`);
      posts = await this.calendarReader.getScheduledPosts(startDate, endDate, true); // Force fresh data
      
      // Check if we found any empty days in this window
      foundEmptyDay = await this.hasEmptyDaysInWindow(posts, today, windowSize);
      
      if (!foundEmptyDay) {
        windowSize += 7; // Expand by 1 week
        console.log(`📈 No empty days found, expanding to ${windowSize} days...`);
      }
    }
    
    console.log(`✅ Using ${windowSize}-day window for cascade analysis`);
    
    // Group posts by topic for each day over dynamic window period
    const topicsDict: Record<number, TopicGroup[]> = {};
    
    for (let day = 0; day < windowSize; day++) {
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
    
    // Create topic counts for dynamic window
    const topicCounts: Record<number, number> = {};
    for (let day = 0; day < windowSize; day++) {
      topicCounts[day] = topicsDict[day]?.length || 0;
    }
    
    console.log(`📊 Current TOPIC distribution (next ${windowSize} days):`, topicCounts);
    console.log('🔍 Topic details by day:', Object.entries(topicsDict).reduce((acc, [day, topics]) => {
      acc[day] = topics.map(t => `${t.topic} (${t.platforms.length} platforms)`);
      return acc;
    }, {} as Record<string, string[]>));
    
    // Debug: Show actual dates for each day
    const dateMapping = {};
    for (let day = 0; day < windowSize; day++) {
      const checkDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
      dateMapping[day] = checkDate.toISOString().split('T')[0];
    }
    console.log(`📅 Day-to-Date mapping (${windowSize} days):`, dateMapping);
    
    // FIXED: Implement TRUE CASCADE LOGIC
    // Priority: Fill weeks in cascade order (Week 1 → Week 2 → Week 3 → double Week 1 → etc.)
    console.log(`🔍 IMPLEMENTING TRUE CASCADE: Fill weeks in proper cascade order across ${windowSize} days...`);
    
    // Check if it's too late in the day to schedule for today (after 10:00 AM EDT)
    const now = new Date();
    const edtTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const currentHour = edtTime.getHours();
    const tooLateForToday = currentHour >= 10; // Skip today if it's 10 AM or later
    const startDay = tooLateForToday ? 1 : currentDay; // Start from tomorrow if too late
    
    if (tooLateForToday) {
      console.log(`⏰ It's past 10:00 AM - skipping today and starting from tomorrow`);
    }
    
    let targetDay = -1;
    let targetTopics = 0;
    
    // STEP 1: TRUE CASCADE LOGIC - Fill weeks in cascade order, not chronological
    console.log(`🌊 STEP 1: TRUE CASCADE SEARCH - Looking for days to fill in proper cascade order...`);
    
    // Analyze each week separately to find true cascade pattern
    const weekAnalysis: Array<{
      weekNumber: number;
      startDay: number;
      endDay: number;
      minTopics: number;
      maxTopics: number;
      hasEmptyDays: boolean;
      days: Array<{ day: number; topics: number; date: string }>;
    }> = [];
    
    const maxWeeks = Math.ceil(windowSize / 7);
    for (let weekOffset = 0; weekOffset < maxWeeks; weekOffset++) {
      const weekStartDay = startDay + (weekOffset * 7);
      const weekEndDay = Math.min(weekStartDay + 7, windowSize);
      
      let minTopics = Infinity;
      let maxTopics = 0;
      let hasEmptyDays = false;
      const days: Array<{ day: number; topics: number; date: string }> = [];
      
      for (let day = weekStartDay; day < weekEndDay; day++) {
        const dayTopics = topicCounts[day] || 0;
        const dayDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        
        days.push({ day, topics: dayTopics, date: dayDate });
        minTopics = Math.min(minTopics, dayTopics);
        maxTopics = Math.max(maxTopics, dayTopics);
        
        if (dayTopics === 0) {
          hasEmptyDays = true;
        }
      }
      
      weekAnalysis.push({
        weekNumber: weekOffset + 1,
        startDay: weekStartDay,
        endDay: weekEndDay,
        minTopics: minTopics === Infinity ? 0 : minTopics,
        maxTopics,
        hasEmptyDays,
        days
      });
    }
    
    console.log(`🌊 WEEK ANALYSIS:`, weekAnalysis.map(w => ({
      week: w.weekNumber,
      minTopics: w.minTopics,
      maxTopics: w.maxTopics,
      hasEmpty: w.hasEmptyDays,
      range: `${w.startDay}-${w.endDay-1}`
    })));
    
    // TRUE CASCADE PROGRESSION: Find global minimum level across all existing weeks (ignoring empty weeks)
    let globalMinLevel = Infinity;
    let globalMaxLevel = 0;
    const populatedWeeks = weekAnalysis.filter(w => w.maxTopics > 0);
    
    for (const week of populatedWeeks) {
      if (week.minTopics < globalMinLevel) globalMinLevel = week.minTopics;
      if (week.maxTopics > globalMaxLevel) globalMaxLevel = week.maxTopics;
    }
    
    // If no populated weeks, start fresh
    if (globalMinLevel === Infinity) {
      globalMinLevel = 0;
    }
    
    console.log(`🌊 GLOBAL CASCADE LEVELS: Min=${globalMinLevel}, Max=${globalMaxLevel} across ${populatedWeeks.length} populated weeks`);
    
    // TRUE CASCADE: Fill all weeks to globalMaxLevel before any week goes beyond globalMaxLevel
    let foundCascadeTarget = false;
    
    for (const week of populatedWeeks) {
      // Check if this week needs progression to match the highest level
      const needsProgression = week.maxTopics < globalMaxLevel;
      
      if (needsProgression) {
        console.log(`🌊 Week ${week.weekNumber}: NEEDS CASCADE PROGRESSION from level ${week.maxTopics} to ${globalMaxLevel}`);
        
        // Find first day in this week that can be progressed
        for (const dayInfo of week.days) {
          if (dayInfo.topics < globalMaxLevel) {
            targetDay = dayInfo.day;
            targetTopics = dayInfo.topics;
            foundCascadeTarget = true;
            console.log(`🎯 CASCADE PROGRESSION: Week ${week.weekNumber}, Day ${dayInfo.day} (${dayInfo.date}) has ${dayInfo.topics} topics - PROGRESSING TO LEVEL ${dayInfo.topics + 1}`);
            break;
          }
        }
        if (foundCascadeTarget) break;
      } else {
        console.log(`🌊 Week ${week.weekNumber}: Already at maximum cascade level (${week.maxTopics})`);
      }
    }
    
    // If no cascade progression needed, look for empty weeks to fill
    if (!foundCascadeTarget) {
      console.log(`🌊 CASCADE COMPLETE: Looking for empty weeks to fill...`);
      
      for (const week of weekAnalysis) {
        if (week.maxTopics === 0 && week.hasEmptyDays) {
          console.log(`🌊 Week ${week.weekNumber}: Empty week found - filling first day`);
          
          // Find first empty day in this week
          for (const dayInfo of week.days) {
            if (dayInfo.topics === 0) {
              targetDay = dayInfo.day;
              targetTopics = dayInfo.topics;
              console.log(`🎯 NEW WEEK FILL: Week ${week.weekNumber}, Day ${dayInfo.day} (${dayInfo.date}) - STARTING AT LEVEL 1`);
              break;
            }
          }
          break;
        }
      }
    }
    
    // STEP 2: If no empty days, look for days with fewer topics than others
    if (targetDay === -1) {
      console.log(`🌊 STEP 2: No empty days found, looking for day with minimum topics...`);
      let minTopics = Infinity;
      
      for (let day = startDay; day < windowSize; day++) {
        const dayTopics = topicCounts[day] || 0;
        const dayDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        
        console.log(`📊 Day ${day} (${dayDate}): ${dayTopics} topics`);
        
        if (dayTopics < minTopics) {
          minTopics = dayTopics;
          targetDay = day;
          targetTopics = dayTopics;
        }
      }
      
      console.log(`🎯 SELECTED DAY WITH MINIMUM TOPICS: Day ${targetDay} has ${targetTopics} topics`);
    }
    
    // STEP 3: Fallback - if somehow no day found, use tomorrow
    if (targetDay === -1) {
      targetDay = startDay;
      targetTopics = topicCounts[targetDay] || 0;
      console.log(`🚨 FALLBACK: Using day ${targetDay} as fallback`);
    }
    
    const targetDate = new Date(today.getTime() + (targetDay * 24 * 60 * 60 * 1000));
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const existingTopics = topicsDict[targetDay] || [];
    
    console.log(`✅ TRUE CASCADE DECISION: Day ${targetDay} (${targetDateStr}) gets topic #${targetTopics + 1}`);
    console.log(`🌊 CASCADE STRATEGY: PROGRESSING WEEK ${Math.floor((targetDay - startDay) / 7) + 1} FROM LEVEL ${targetTopics} TO ${targetTopics + 1} (window: ${windowSize} days)`);
    
    // Calculate optimal time slot avoiding conflicts
    const optimalTimeSlot = this.calculateOptimalTimeSlot(targetDate, existingTopics);
    
    return {
      day: targetDay,
      date: targetDate.toISOString().split('T')[0],
      dateObj: targetDate,
      currentTopics: targetTopics,
      newLevel: targetTopics + 1,
      action: `Post topic #${targetTopics + 1} on day ${targetDay} (cascade progression: Week ${Math.floor((targetDay - startDay) / 7) + 1} from level ${targetTopics} to ${targetTopics + 1})`,
      isLevelIncrease: false, // Using dynamic window logic
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
   * Visualize the dynamic cascading pattern (TOPICS not posts)
   * Shows pattern for same window size used in decision making
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
    // Use same logic as getNextAction to determine window size
    const today = new Date();
    let windowSize = 14;
    let foundEmptyDay = false;
    
    while (!foundEmptyDay && windowSize <= 35) {
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + (windowSize * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const tempPosts = await this.calendarReader.getScheduledPosts(startDate, endDate, true); // Force fresh data
      
      foundEmptyDay = await this.hasEmptyDaysInWindow(tempPosts, today, windowSize);
      if (!foundEmptyDay) {
        windowSize += 7;
      }
    }
    
    // Now get full data for the determined window size
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + (windowSize * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const posts = await this.calendarReader.getScheduledPosts(startDate, endDate, true); // Force fresh data
    const nextAction = await this.getNextAction();
    
    const pattern = [];
    
    for (let day = 0; day < windowSize; day++) {
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
    
    const emptyDays = pattern.filter(p => p.currentTopics === 0).length;
    const totalTopics = pattern.reduce((sum, p) => sum + p.currentTopics, 0);
    
    let summary = `📊 Dynamic Cascade: ${totalTopics} topics across ${windowSize} days | `;
    summary += `Empty Days: ${emptyDays} | `;
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