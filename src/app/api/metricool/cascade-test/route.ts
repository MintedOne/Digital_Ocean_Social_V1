import { NextResponse } from 'next/server';
import { metricoolCalendar } from '@/lib/metricool/calendar-reader';
import { CascadingScheduler, simulateCascadeExecution } from '@/lib/metricool/cascading-scheduler';

export async function GET() {
  try {
    console.log('🌊 CASCADING SCHEDULER TEST: Starting comprehensive test...');
    
    const cascadeScheduler = new CascadingScheduler(metricoolCalendar);
    
    // Test 1: Get current cascade decision
    console.log('\n--- TEST 1: Current Cascade Decision ---');
    const currentDecision = await cascadeScheduler.getNextAction();
    
    // Test 2: Visualize current pattern
    console.log('\n--- TEST 2: Current Cascade Pattern ---');
    const patternViz = await cascadeScheduler.visualizeCascadePattern();
    
    // Test 3: Test optimal posting time
    console.log('\n--- TEST 3: Optimal Posting Time ---');
    const optimalTime = cascadeScheduler.calculateOptimalPostingTime(currentDecision);
    
    // Test 4: Test platform staggering
    console.log('\n--- TEST 4: Platform Staggering ---');
    const platforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'gmb'];
    const staggeredTimes = cascadeScheduler.getStaggeredPlatformTimes(optimalTime, platforms);
    
    // Test 5: Simulate next 10 posting decisions
    console.log('\n--- TEST 5: Simulation (10 days) ---');
    // Note: This is a simulation, not actual posting
    // const simulation = await simulateCascadeExecution(cascadeScheduler, 10);
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        currentDecision: {
          day: currentDecision.day,
          date: currentDecision.date,
          action: currentDecision.action,
          currentTopics: currentDecision.currentTopics,
          newLevel: currentDecision.newLevel,
          isLevelIncrease: currentDecision.isLevelIncrease,
          conflictAnalysis: currentDecision.conflictAnalysis
        },
        patternVisualization: {
          summary: patternViz.summary,
          pattern: patternViz.pattern.map(p => ({
            day: p.day,
            date: p.date,
            dayName: p.dayName,
            currentTopics: p.currentTopics,
            topicDetails: p.topicDetails,
            status: p.day === currentDecision.day ? '← NEXT TOPIC HERE' : ''
          })),
          nextAction: patternViz.nextAction.action
        },
        optimalTime: {
          timestamp: optimalTime.toISOString(),
          formatted: optimalTime.toLocaleString('en-US', { 
            timeZone: 'America/New_York',
            weekday: 'long',
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          }),
          reasoning: `Topic #${currentDecision.currentTopics + 1} for ${currentDecision.date} (${currentDecision.conflictAnalysis.reasonForSlot})`
        },
        staggeredTimes: Object.entries(staggeredTimes).reduce((acc, [platform, time]) => {
          acc[platform] = {
            timestamp: time.toISOString(),
            formatted: time.toLocaleString('en-US', { 
              timeZone: 'America/New_York',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            })
          };
          return acc;
        }, {} as Record<string, any>)
      },
      explanation: {
        logic: "True Cascading Pattern (TOPICS not posts)",
        description: "TRUE CASCADE: Fill Week 1 → Week 2 → Week 3 → THEN double Week 1 → double Week 2 → double Week 3 → THEN triple Week 1. Never extends to new weeks before doubling/tripling earlier weeks.",
        currentState: `True cascade analysis shows ${currentDecision.newLevel} topics on target day`,
        nextStep: currentDecision.action,
        priority: "Always fills weeks in cascade order - prioritize earlier weeks for doubling before extending to new weeks",
        timeSlots: "9AM, 12:30PM, 3:15PM, 5:45PM, 7:30PM with conflict detection"
      }
    };

    console.log('✅ CASCADE TEST COMPLETE');
    console.log('📊 Summary:', response.explanation);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Cascade test failed:', error);
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