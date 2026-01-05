import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MascotTip {
    message: string;
    duration?: number;
    priority?: number;
}

export interface TrendAnalysis {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    hasSpike?: boolean;
    hasDrop?: boolean;
    variability?: 'low' | 'medium' | 'high';
}

@Injectable({
    providedIn: 'root'
})
export class MascotTipsService {
    private currentTipSubject = new BehaviorSubject<MascotTip | null>(null);
    public currentTip$ = this.currentTipSubject.asObservable();

    private tips = {
        steps: {
            general: "This chart shows how your daily step count evolves over time. Trends matter more than single days—consistency is the real indicator of activity health.",
            upward: "Nice progress! Your average step count is increasing, which usually reflects improved cardiovascular endurance and daily mobility.",
            downward: "I'm noticing a gradual decline in steps. This can happen due to schedule changes, fatigue, or seasonal effects. Consider short walks to stabilize the trend.",
            stable: "Your step count is relatively stable. Maintaining this level is good, but small increases—500 to 1,000 extra steps—can bring measurable benefits.",
            spike: "This day stands out with unusually high activity. Long walks, travel, or workouts often cause spikes like this. Great effort—but don't rely on outliers alone.",
            drop: "This dip may indicate rest, illness, or a sedentary day. Occasional lows are normal, but repeated drops can affect overall fitness.",
            weeklyPattern: "You tend to walk more on certain days of the week. Identifying these patterns can help you plan active routines more effectively.",
            personalAverage: "Today's steps are compared to your personal average, not a universal target. Your body responds best to progress relative to your own baseline.",
            goalThreshold: "Crossing this zone is often associated with improved metabolic and heart health. Even partial progress toward it still counts.",
            longTerm: "Looking at longer periods reduces daily noise and highlights true behavioral changes. Long-term trends are the most reliable health indicators.",
            lowVariability: "Your daily steps don't fluctuate much. This consistency is excellent for habit formation and injury prevention.",
            highVariability: "Your activity varies widely between days. Balancing intense days with light recovery walks can help stabilize energy levels."
        },
        calories: {
            general: "Your calorie burn reflects both active exercise and your body's baseline metabolic rate. Understanding this split helps optimize energy balance.",
            upward: "Your calorie expenditure is trending up! This suggests increased activity or improved metabolic efficiency. Keep up the momentum.",
            downward: "Calorie burn is decreasing. This might reflect reduced activity levels or changes in exercise intensity. Small adjustments can reverse this trend.",
            stable: "Your energy expenditure is consistent. This stability is valuable for maintaining weight and establishing sustainable habits.",
            activeVsBasal: "Active calories come from movement, while basal calories support basic functions like breathing and digestion. Both matter for total health.",
            deficit: "You're burning more calories than average. If weight loss is your goal, ensure you're fueling adequately to maintain energy and recovery.",
            surplus: "Lower calorie burn days are normal. Rest and recovery are essential—your body needs downtime to adapt and strengthen.",
            efficiency: "Your body is becoming more efficient at converting energy. This is a sign of improved fitness, though it may require adjusting activity to see continued progress."
        },
        distance: {
            general: "Distance traveled shows the cumulative effect of all your movements—not just dedicated exercise. Every kilometer contributes to cardiovascular health.",
            upward: "You're covering more ground! Increased distance often correlates with better endurance and aerobic capacity.",
            downward: "Your walking or running distance has decreased. Life happens—focus on gradual increases when you're ready.",
            stable: "Your distance remains steady. Consistency at this level supports long-term health maintenance.",
            conversion: "Each kilometer walked burns roughly 50-80 calories depending on pace and body weight. Distance adds up over time.",
            terrain: "Consider that hills, stairs, and uneven terrain increase calorie burn even at the same distance. Quality matters as much as quantity."
        },
        weight: {
            general: "Weight fluctuates naturally due to hydration, food timing, and hormonal cycles. Focus on weekly or monthly trends rather than daily numbers.",
            upward: "Weight is increasing. If unintended, review your calorie balance and activity levels. If building muscle, this might be expected progress.",
            downward: "You're losing weight. Ensure this aligns with your goals and that the rate is sustainable (typically 0.5-1kg per week).",
            stable: "Your weight is stable. This indicates energy balance—calories in match calories out. Perfect for maintenance phases.",
            fluctuation: "Daily weight varies by 1-2 kg normally. Water retention, meal timing, and digestion all influence the scale. Don't overreact to single data points.",
            fatLoss: "Fat loss requires a calorie deficit of roughly 7,700 kcal per kilogram. Slow, steady progress preserves muscle and keeps metabolism healthy.",
            muscle: "If you're strength training, weight might stay stable while body composition improves. Consider other metrics like how clothes fit or energy levels."
        },
        flights: {
            general: "Flights climbed tracks vertical movement—stairs, hills, and inclines. This high-intensity activity strengthens legs and improves cardiovascular fitness.",
            upward: "More flights climbed! Vertical movement is excellent for building lower body strength and burning extra calories.",
            downward: "Fewer flights lately. If you have access to stairs, even a few extra flights daily makes a measurable difference.",
            stable: "Your vertical activity is consistent. Stairs are one of the most efficient exercises for leg strength and heart health.",
            benefits: "Climbing stairs burns nearly twice the calories of walking on flat ground and significantly strengthens glutes, quads, and calves.",
            everyday: "Look for opportunities: Take stairs instead of elevators, park on upper floors, or add hill walks to your routine."
        },
        activity: {
            general: "This shows your overall activity distribution. Apple Health tracks Move (calories), Exercise (elevated heart rate), and Stand (hourly movement).",
            moveRing: "The Move ring measures active calories burned. Consistent progress here correlates with better metabolic health and weight management.",
            exerciseRing: "Exercise minutes track elevated heart rate activity. Aim for 30+ minutes daily of brisk walking, running, or sports.",
            standRing: "Standing hourly breaks up sedentary time, which reduces cardiovascular risk and improves circulation. Small movements matter.",
            completion: "Completing all three rings daily is a powerful habit. It balances intensity (exercise), volume (move), and consistency (stand).",
            consistency: "Streak days matter more than perfection. Even partial ring closure on tough days maintains momentum and habit strength.",
            adaptation: "Your body adapts to activity over time. Gradually increase goals every few weeks to continue seeing progress."
        },
        chart: {
            trend: "Charts reveal patterns invisible in daily data. Look for slopes (trends), clusters (habits), and outliers (special events).",
            comparison: "Comparing metrics side-by-side shows relationships—like how step increases correlate with calorie burn or improved mood.",
            dateRange: "Shorter ranges (7-14 days) show immediate feedback. Longer ranges (30+ days) reveal true habit changes and seasonal effects.",
            annotations: "Hover over data points for details. Understanding context—travel, illness, workouts—helps interpret numbers correctly.",
            goals: "Visual goal lines help track progress. But remember: being below goal occasionally is normal. Trends matter more than single days."
        },
        summary: {
            general: "Your health dashboard aggregates multiple metrics to paint a complete picture. No single number tells the whole story—look at patterns across all data.",
            holistic: "Physical health emerges from the combination of movement, recovery, nutrition, sleep, and stress management. These metrics capture the movement piece.",
            personalized: "Your ideal activity level is unique. Compare to your own baseline and goals, not to others or arbitrary standards.",
            progress: "Progress isn't always linear. Plateaus, setbacks, and variability are all normal. Long-term consistency beats short-term perfection.",
            celebrate: "Take time to acknowledge improvements—even small ones. Behavior change is hard, and every positive trend deserves recognition."
        }
    };

    showTip(tip: MascotTip) {
        this.currentTipSubject.next(tip);
    }

    hideTip() {
        this.currentTipSubject.next(null);
    }

    // Steps-specific tips
    getStepsTip(context: 'general' | TrendAnalysis): string {
        if (context === 'general') {
            return this.tips.steps.general;
        }

        const trend = context as TrendAnalysis;
        
        if (trend.hasSpike) {
            return this.tips.steps.spike;
        }
        
        if (trend.hasDrop) {
            return this.tips.steps.drop;
        }

        if (trend.variability === 'low') {
            return this.tips.steps.lowVariability;
        }

        if (trend.variability === 'high') {
            return this.tips.steps.highVariability;
        }

        switch (trend.direction) {
            case 'up':
                return this.tips.steps.upward;
            case 'down':
                return this.tips.steps.downward;
            case 'stable':
                return this.tips.steps.stable;
            default:
                return this.tips.steps.general;
        }
    }

    // Calories-specific tips
    getCaloriesTip(context: 'general' | TrendAnalysis): string {
        if (context === 'general') {
            return this.tips.calories.general;
        }

        const trend = context as TrendAnalysis;

        switch (trend.direction) {
            case 'up':
                return this.tips.calories.upward;
            case 'down':
                return this.tips.calories.downward;
            case 'stable':
                return this.tips.calories.stable;
            default:
                return this.tips.calories.general;
        }
    }

    // Distance-specific tips
    getDistanceTip(context: 'general' | TrendAnalysis): string {
        if (context === 'general') {
            return this.tips.distance.general;
        }

        const trend = context as TrendAnalysis;

        switch (trend.direction) {
            case 'up':
                return this.tips.distance.upward;
            case 'down':
                return this.tips.distance.downward;
            case 'stable':
                return this.tips.distance.stable;
            default:
                return this.tips.distance.general;
        }
    }

    // Weight-specific tips
    getWeightTip(context: 'general' | TrendAnalysis): string {
        if (context === 'general') {
            return this.tips.weight.general;
        }

        const trend = context as TrendAnalysis;

        switch (trend.direction) {
            case 'up':
                return this.tips.weight.upward;
            case 'down':
                return this.tips.weight.downward;
            case 'stable':
                return this.tips.weight.stable;
            default:
                return this.tips.weight.general;
        }
    }

    // Flights-specific tips
    getFlightsTip(context: 'general' | TrendAnalysis): string {
        if (context === 'general') {
            return this.tips.flights.general;
        }

        const trend = context as TrendAnalysis;

        switch (trend.direction) {
            case 'up':
                return this.tips.flights.upward;
            case 'down':
                return this.tips.flights.downward;
            case 'stable':
                return this.tips.flights.stable;
            default:
                return this.tips.flights.general;
        }
    }

    // Activity-specific tips
    getActivityTip(type: string): string {
        switch (type) {
            case 'move':
                return this.tips.activity.moveRing;
            case 'exercise':
                return this.tips.activity.exerciseRing;
            case 'stand':
                return this.tips.activity.standRing;
            case 'completion':
                return this.tips.activity.completion;
            default:
                return this.tips.activity.general;
        }
    }

    // Chart-specific tips
    getChartTip(type: string): string {
        switch (type) {
            case 'trend':
                return this.tips.chart.trend;
            case 'comparison':
                return this.tips.chart.comparison;
            case 'dateRange':
                return this.tips.chart.dateRange;
            default:
                return this.tips.chart.trend;
        }
    }

    // Summary tips
    getSummaryTip(): string {
        const tips = [
            this.tips.summary.general,
            this.tips.summary.holistic,
            this.tips.summary.personalized,
            this.tips.summary.progress,
            this.tips.summary.celebrate
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    }

    // Additional contextual tips
    getContextualTip(metric: string, value: number, average: number): string {
        const percentDiff = ((value - average) / average) * 100;

        if (metric === 'steps') {
            if (value > 10000) {
                return this.tips.steps.goalThreshold;
            } else if (Math.abs(percentDiff) < 5) {
                return this.tips.steps.personalAverage;
            }
        }

        if (metric === 'calories') {
            if (value > average * 1.2) {
                return this.tips.calories.deficit;
            } else if (value < average * 0.8) {
                return this.tips.calories.surplus;
            }
        }

        return '';
    }
}
