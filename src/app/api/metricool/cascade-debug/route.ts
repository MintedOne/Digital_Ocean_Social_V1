import { NextResponse } from 'next/server';
import { metricoolCalendar } from '@/lib/metricool/calendar-reader';
import { CascadingScheduler } from '@/lib/metricool/cascading-scheduler';

export async function GET() {
  try {
    console.log('🌊 CASCADE DEBUG: Testing topic grouping logic...');
    
    const cascadeScheduler = new CascadingScheduler(metricoolCalendar);
    
    // Get current cascade decision with full debug info
    const currentDecision = await cascadeScheduler.getNextAction();
    
    // Get visualization of current pattern
    const patternViz = await cascadeScheduler.visualizeCascadePattern();
    
    // Get calendar data for comparison - FIXED: include the full 8th day
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + (8 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const posts = await metricoolCalendar.getScheduledPosts(startDate, endDate);
    
    // Build day-by-day analysis
    const dayAnalysis = [];
    for (let day = 0; day <= 7; day++) {
      const checkDate = new Date(today.getTime() + (day * 24 * 60 * 60 * 1000));
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const dayPosts = posts.filter(post => {
        if (!post.publicationDate?.dateTime) return false;
        const postDate = post.publicationDate.dateTime.split('T')[0];
        return postDate === checkDateStr;
      });
      
      // Get unique topics for this day
      const dayTopics = patternViz.pattern.find(p => p.date === checkDateStr);
      
      dayAnalysis.push({
        day,
        date: checkDateStr,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDate.getDay()],
        totalPosts: dayPosts.length,
        topicCount: dayTopics?.currentTopics || 0,
        topics: dayTopics?.topicDetails || [],
        platformBreakdown: dayPosts.reduce((acc, post) => {
          post.providers?.forEach(provider => {
            acc[provider.network] = (acc[provider.network] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>)
      });
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      cascadeDecision: {
        targetDay: currentDecision.day,
        targetDate: currentDecision.date,
        currentTopics: currentDecision.currentTopics,
        maxLevel: currentDecision.newLevel,
        action: currentDecision.action,
        isLevelIncrease: currentDecision.isLevelIncrease,
        optimalTime: currentDecision.optimalTimeSlot.toISOString(),
        conflictReason: currentDecision.conflictAnalysis.reasonForSlot
      },
      dayByDayAnalysis: dayAnalysis,
      topicGroupingVerification: {
        explanation: "Each yacht posted to multiple platforms within 2 hours counts as 1 topic",
        currentLevel: currentDecision.newLevel,
        nextActionNeeded: currentDecision.action
      },
      insights: {
        todayStatus: `Day 0 has ${dayAnalysis[0].topicCount}/${currentDecision.newLevel} topics`,
        gapsFound: dayAnalysis.filter(d => d.topicCount < currentDecision.newLevel).map(d => ({
          day: d.day,
          date: d.date,
          current: d.topicCount,
          needed: currentDecision.newLevel - d.topicCount
        })),
        recommendation: currentDecision.action
      }
    };

    console.log('✅ CASCADE DEBUG COMPLETE');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Cascade debug failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}