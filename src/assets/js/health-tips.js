/**
 * Extended Health Tips for Interactive Mascot
 * 
 * This configuration extends the base waifu tips with health-specific contextual tips
 * that trigger when hovering over various dashboard components.
 */

const healthTips = {
    // Dashboard component selectors
    mouseover: [
        // Stats Cards
        {
            selector: '.steps-card',
            text: [
                "Your steps tell a story of daily movement. Every step counts toward better cardiovascular health!",
                "Walking is one of the simplest and most effective forms of exercise. Keep those steps consistent!",
                "Steps fluctuate day-to-day, but the overall trend matters most for long-term health."
            ]
        },
        {
            selector: '.calories-card',
            text: [
                "Calories burned = Active movement + Your body's baseline metabolism. Both parts matter!",
                "Your energy expenditure reflects all your daily activities, from intense workouts to casual walks.",
                "Consistent calorie burn supports healthy weight management and metabolic function."
            ]
        },
        {
            selector: '.distance-card',
            text: [
                "Distance accumulates from all your movements throughout the day. Every kilometer improves endurance!",
                "Whether you walk, run, or cycle, distance traveled is a great indicator of overall activity.",
                "Terrain matters! Hills and stairs increase calorie burn even at the same distance."
            ]
        },
        {
            selector: '.weight-card',
            text: [
                "Weight naturally fluctuates 1-2 kg daily due to hydration and food timing. Focus on weekly trends!",
                "Body composition matters more than the number on the scale. Muscle weighs more than fat!",
                "Sustainable weight loss is typically 0.5-1 kg per week. Slow and steady wins the race!"
            ]
        },
        
        // Chart Titles
        {
            selector: '.chart-title',
            text: [
                "Charts reveal patterns invisible in daily numbers. Look for trends, not perfection!",
                "Longer time periods reduce daily noise and show true behavioral changes.",
                "Compare metrics side-by-side to see how different activities relate to each other."
            ]
        },
        
        // Activity Rings
        {
            selector: '.ring-cell',
            text: [
                "Each ring closure represents a daily health achievement. Consistency builds lasting habits!",
                "Don't worry about perfection. Even partial ring progress is better than none!",
                "Your body adapts over time. Consider increasing goals gradually every few weeks."
            ]
        },
        
        // Trend Badges
        {
            selector: '.trend-badge',
            text: [
                "This trend compares recent days to your earlier baseline. Progress isn't always linear!",
                "Upward trends in activity usually mean improved fitness and cardiovascular health.",
                "Plateaus and setbacks are normal. What matters is getting back on track!"
            ]
        },
        
        // Date Range Selector
        {
            selector: '.date-selector',
            text: [
                "Short ranges (7-14 days) show immediate feedback. Longer ranges reveal true habit changes.",
                "Try comparing different time periods to see how your activity evolves!",
                "Seasonal patterns are real. Activity often changes with weather and daylight hours."
            ]
        },
        
        // View Toggle
        {
            selector: '.view-toggle',
            text: [
                "Daily view shows granular data. Weekly view smooths out day-to-day variation.",
                "Trends view uses moving averages to highlight long-term patterns.",
                "Different views reveal different insights. Explore them all!"
            ]
        },
        
        // Health Score
        {
            selector: '.health-score',
            text: [
                "Your health score combines multiple factors: consistency, goal achievement, and activity levels.",
                "This is personalized to YOUR baseline, not universal standards.",
                "Small improvements compound over time. Focus on progress, not perfection!"
            ]
        },
        
        // Activity Level Indicators
        {
            selector: '.activity-level-item',
            text: [
                "Activity distribution shows how you spend your days. Balance is key!",
                "More active days correlate with better metabolic health and mood.",
                "Even light activity breaks up sedentary time and improves circulation."
            ]
        },
        
        // Chart Type Toggle Buttons
        {
            selector: '.chart-type-toggle button',
            text: [
                "Bar charts show discrete daily values clearly.",
                "Line charts emphasize trends and patterns over time.",
                "Area charts highlight cumulative volume and fill."
            ]
        },
        
        // Active vs Basal
        {
            selector: '.active-basal',
            text: [
                "Active calories come from movement. Basal calories support basic body functions.",
                "Both types of energy expenditure contribute to total daily calorie burn.",
                "Increasing active calories through movement is the easiest way to create a deficit."
            ]
        },
        
        // Goal Achievement
        {
            selector: '.goal-achievement',
            text: [
                "Goal completion rate shows consistency. Even 70-80% is excellent long-term!",
                "Adjust goals if you're consistently over or under. They should be challenging but achievable.",
                "Streaks matter! Consecutive days of progress build powerful momentum."
            ]
        },
        
        // Monthly Period Chips
        {
            selector: '.period-chip',
            text: [
                "Comparing month-to-month reveals seasonal patterns and long-term trends.",
                "Look for gradual improvements over time. Small gains compound!",
                "Life changes month by month. Your activity patterns reflect your circumstances."
            ]
        },
        
        // Analytics Cards
        {
            selector: '.analytics-card',
            text: [
                "Advanced analytics break down your health metrics in greater detail.",
                "Understanding the components helps you make informed decisions.",
                "No single metric tells the whole story. Look at the complete picture!"
            ]
        },
        
        // Move/Exercise/Stand Rings
        {
            selector: '.rings-legend',
            text: [
                "Move tracks active calories. Exercise measures elevated heart rate. Stand encourages hourly movement.",
                "All three rings together create a balanced approach to daily activity.",
                "Completing rings daily is a powerful habit that compounds over time!"
            ]
        },
        
        // Dashboard Header
        {
            selector: '.main-title',
            text: [
                "Welcome to your personal health analytics dashboard!",
                "All your Apple Health data, analyzed and visualized for better insights.",
                "Understanding your patterns is the first step to improving your health!"
            ]
        },
        
        // Stats Details
        {
            selector: '.stats-details',
            text: [
                "Avg = Average value. Med = Median (middle value). Max/Min = Extreme values.",
                "The median is often more representative than average, as it's less affected by outliers.",
                "Total shows cumulative progress over the selected time period."
            ]
        },
        
        // Chart Wrapper (when hovering charts themselves)
        {
            selector: '.chart-wrapper',
            text: [
                "Hover over data points for detailed values and dates.",
                "Charts make patterns visible that numbers alone can't reveal.",
                "Use zoom and pan if available to explore specific time periods."
            ]
        },
        
        // Footer Stats
        {
            selector: '.footer-stats',
            text: [
                "These summary statistics provide a bird's-eye view of your overall health journey.",
                "Track these numbers over months to see your long-term progress and patterns.",
                "Each metric tells part of your health story. Together they reveal the complete picture."
            ]
        },
        {
            selector: '.footer-stat',
            text: [
                "Summary stats show your cumulative progress and overall health patterns.",
                "These aggregated metrics help you see the big picture beyond daily fluctuations.",
                "Improving these numbers indicates sustainable, long-term health improvements."
            ]
        }
    ]
};

// Export for use in Angular components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = healthTips;
}
