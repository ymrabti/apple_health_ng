# Interactive Anime Mascot System

## Overview

The Apple Health dashboard now features an **interactive anime mascot** that provides contextual health tips and explanations when you hover over different components of the application. This creates an engaging, educational experience that helps users understand their health metrics better.

## Features

### 1. **Contextual Tips System**

The mascot responds to mouse hover events across the entire dashboard, providing relevant insights:

#### **Stat Cards**
- **Steps Card**: Explains step trends, consistency, and cardiovascular benefits
- **Calories Card**: Breaks down active vs basal calories and energy expenditure
- **Distance Card**: Discusses cumulative movement and terrain effects
- **Weight Card**: Clarifies weight fluctuations and sustainable loss rates

#### **Chart Components**
- **Steps Trend Chart**: Analyzes upward/downward/stable trends with specific guidance
- **Calories Chart**: Provides energy balance insights
- **Activity Charts**: Explains Move, Exercise, and Stand rings
- **Chart Type Toggles**: Helps choose between bar/line/area visualizations

#### **Activity Rings**
- **Move Ring**: Explains active calorie tracking
- **Exercise Ring**: Discusses elevated heart rate activity
- **Stand Ring**: Emphasizes hourly movement benefits
- **Ring Completion**: Encourages consistency and habit formation

### 2. **Intelligent Trend Analysis**

The system analyzes your data to provide smart, personalized tips:

```typescript
// Automatic trend detection
- Upward Trend: "Nice progress! Your average is increasing..."
- Downward Trend: "I notice a decline. Consider short walks..."
- Stable Trend: "Your count is stable. Small increases can help..."
- Spike Detection: "This day stands out with unusual activity..."
- Drop Detection: "This dip may indicate rest or illness..."
- Variability Analysis: "Your activity varies widely between days..."
```

### 3. **Component-Specific Tips**

Each dashboard element has tailored explanations:

**Date Range Selector**
> "Short ranges (7-14 days) show immediate feedback. Longer ranges reveal true habit changes."

**View Toggle (Daily/Weekly/Trends)**
> "Daily view shows granular data. Weekly view smooths out day-to-day variation."

**Health Score**
> "Your health score combines multiple factors: consistency, goal achievement, and activity levels."

**Chart Hover**
> "Hover over data points for detailed values and dates. Charts make patterns visible."

## Architecture

### Service Layer: `MascotTipsService`

Located at: `src/app/services/mascot-tips.service.ts`

**Purpose**: Centralizes all tip logic and provides methods for different contexts.

```typescript
export class MascotTipsService {
  // Get tips based on metric and trend
  getStepsTip(context: 'general' | TrendAnalysis): string
  getCaloriesTip(context: 'general' | TrendAnalysis): string
  getDistanceTip(context: 'general' | TrendAnalysis): string
  getWeightTip(context: 'general' | TrendAnalysis): string
  
  // Activity-specific tips
  getActivityTip(type: string): string
  
  // Chart-related tips
  getChartTip(type: string): string
  
  // Show/hide tip programmatically
  showTip(tip: MascotTip): void
  hideTip(): void
}
```

### Component Integration: `Dashboard`

The dashboard component analyzes data and triggers appropriate tips:

```typescript
// On card hover - analyze trend and show tip
onCardHover(cardType: 'steps' | 'calories' | 'distance' | 'weight') {
  const trend = this.analyzeTrend(this.filteredData.map(d => d[cardType]));
  const tip = this.mascotTipsService.getStepsTip(trend);
  this.mascotTipsService.showTip({ message: tip, duration: 6000 });
}

// Trend analysis with spike/drop/variability detection
private analyzeTrend(data: number[]): TrendAnalysis {
  // Calculates direction, percentage, variability
  // Detects spikes (> 2 std dev above mean)
  // Detects drops (> 2 std dev below mean)
}
```

### Mascot Component: `AnimeMascot`

Located at: `src/app/components/anime-mascot/`

**Updates:**
- Subscribes to `MascotTipsService.currentTip$`
- Merges health-specific tips with existing waifu tips
- Displays tips with animation and auto-hide timer

```typescript
ngOnInit() {
  // Subscribe to service for programmatic tips
  this.tipSubscription = this.mascotTipsService.currentTip$.subscribe(tip => {
    if (tip) {
      this.r(tip.message, tip.duration, tip.priority);
    }
  });
  
  // Merge health tips with base tips
  if (typeof healthTips !== 'undefined') {
    this.waifuTips.mouseover = [...this.waifuTips.mouseover, ...healthTips.mouseover];
  }
}
```

### Data Files

**Base Tips**: `src/assets/data.min.js`
- Original mascot personality and generic tips

**Health Tips**: `src/assets/js/health-tips.js`
- Dashboard-specific contextual tips
- CSS selector-based mouseover triggers
- Health metric explanations

## HTML Template Updates

Hover events added throughout `dashboard.html`:

```html
<!-- Stat Cards -->
<div class="stat-card steps-card" 
     (mouseenter)="onCardHover('steps')" 
     (mouseleave)="onCardLeave('steps')">
  ...
</div>

<!-- Chart Titles -->
<h3 class="chart-title" 
    (mouseenter)="onChartHover('steps', 'title')" 
    (mouseleave)="onCardLeave('chart')">
  Steps Trend
</h3>

<!-- Activity Buttons -->
<button (mouseenter)="onActivityRingHover('exercise')" 
        (mouseleave)="onCardLeave('activity')">
  Exercise
</button>
```

## Tip Categories

### 1. **General Overview Tips**
Explain what a component shows and why it matters.

### 2. **Trend-Based Tips**
React to data patterns (up/down/stable/spike/drop).

### 3. **Actionable Advice**
Suggest specific actions users can take.

### 4. **Educational Context**
Provide health science background and explanations.

### 5. **Encouraging Messages**
Celebrate progress and maintain motivation.

## Configuration

### Tip Duration & Priority

```typescript
interface MascotTip {
  message: string;
  duration?: number;    // Default: 6000ms (6 seconds)
  priority?: number;    // Default: 8 (higher = more important)
}
```

- **Duration**: How long the tip displays
- **Priority**: Used by the mascot to manage tip queuing

### Trend Analysis Parameters

```typescript
// Variability classification
coefficientOfVariation < 15%  → Low variability
coefficientOfVariation < 30%  → Medium variability
coefficientOfVariation >= 30% → High variability

// Trend direction
percentage < 5%   → Stable
percentage > 0    → Upward trend
percentage < 0    → Downward trend

// Outlier detection
value > mean + (2 × stdDev)  → Spike
value < mean - (2 × stdDev)  → Drop
```

## Adding New Tips

### 1. **Add to Service** (`mascot-tips.service.ts`)

```typescript
private tips = {
  newMetric: {
    general: "General explanation...",
    upward: "Increasing trend message...",
    downward: "Decreasing trend message...",
    // ... more contexts
  }
};

getNewMetricTip(context: 'general' | TrendAnalysis): string {
  // Implementation
}
```

### 2. **Add to Health Tips** (`health-tips.js`)

```typescript
mouseover: [
  {
    selector: '.new-component',
    text: [
      "Tip option 1",
      "Tip option 2",
      "Tip option 3"
    ]
  }
]
```

### 3. **Add Dashboard Handler**

```typescript
onNewComponentHover() {
  const tip = this.mascotTipsService.getNewMetricTip('general');
  this.mascotTipsService.showTip({ message: tip, duration: 5000 });
}
```

### 4. **Update Template**

```html
<div class="new-component" 
     (mouseenter)="onNewComponentHover()" 
     (mouseleave)="onCardLeave('component')">
  ...
</div>
```

## Best Practices

### Tip Writing Guidelines

1. **Be Concise**: Keep tips under 100 words
2. **Be Specific**: Reference actual data when possible
3. **Be Helpful**: Provide actionable advice
4. **Be Positive**: Frame challenges constructively
5. **Be Educational**: Explain the "why" behind metrics

### Example - Good Tip ✓
> "Your step count is increasing! This typically reflects improved cardiovascular endurance. Keep up the consistency—trends matter more than single days."

### Example - Poor Tip ✗
> "Steps are up. Good job."

## Troubleshooting

### Tips Not Appearing

1. **Check Service Injection**: Ensure `MascotTipsService` is provided
2. **Verify Subscriptions**: Check `tipSubscription` in `AnimeMascot`
3. **Check Scripts**: Confirm `health-tips.js` loads in `angular.json`
4. **Console Errors**: Look for `healthTips is not defined`

### Tips Showing Wrong Content

1. **Review Trend Analysis**: Check `analyzeTrend()` logic
2. **Verify Selectors**: Ensure CSS selectors in `health-tips.js` match
3. **Check Data**: Confirm `filteredData` has expected values

### Performance Issues

1. **Debounce Hovers**: Add delay before showing tips
2. **Limit Tip Duration**: Keep under 8 seconds
3. **Clear Timeouts**: Ensure old tips clear before new ones

## Future Enhancements

- [ ] Add sound effects for tips
- [ ] Implement tip history/replay
- [ ] Add custom tip schedules (daily wisdom)
- [ ] Multi-language support
- [ ] User preference to disable tips
- [ ] Tip effectiveness tracking
- [ ] Personalized tip learning (ML-based)
- [ ] Voice synthesis for accessibility

## Credits

Built on top of the Live2D anime mascot system, extended with health-specific intelligence and contextual awareness to create an engaging, educational dashboard experience.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: Apple Health Dashboard Team
