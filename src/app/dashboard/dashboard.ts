import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HealthData {
  date: string;
  displayDate: string;
  steps: number;
  calories: number;
  distance: number;
  weight: number;
  fatLoss: number;
}

interface Stats {
  current: number;
  average: number;
  median: number;
  max: number;
  min: number;
  total: number;
}
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  dateRange: string = '7d';
  selectedView: string = 'daily';
  views: string[] = ['daily', 'weekly', 'trends'];

  healthData: HealthData[] = [];
  filteredData: HealthData[] = [];

  stepsStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
  caloriesStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
  distanceStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
  weightStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };

  animatedValues = { steps: 0 };

  activityLevels = [
    { label: 'Very Active', value: 85, color: '#10B981' },
    { label: 'Active', value: 65, color: '#F59E0B' },
    { label: 'Light Activity', value: 45, color: '#6B7280' },
    { label: 'Sedentary', value: 25, color: '#EF4444' },
  ];

  ngOnInit() {
    this.generateHealthData();
    this.updateFilteredData();
    this.calculateAllStats();
    this.animateStepsValue();
  }

  ngOnDestroy() {
    // Clean up any subscriptions or intervals
  }

  generateHealthData() {
    const data: HealthData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        steps: Math.floor(Math.random() * 5000) + 8000,
        calories: Math.floor(Math.random() * 800) + 1800,
        distance: parseFloat((Math.random() * 3 + 5).toFixed(1)),
        weight: parseFloat((Math.random() * 2 + 68).toFixed(1)),
        fatLoss: parseFloat((Math.random() * 0.2 + 0.1).toFixed(2)),
      });
    }
    this.healthData = data;
  }

  onDateRangeChange() {
    this.updateFilteredData();
    this.calculateAllStats();
    this.animateStepsValue();
  }

  updateFilteredData() {
    const days = parseInt(this.dateRange.replace('d', ''));
    this.filteredData = this.healthData.slice(-days);
  }

  setSelectedView(view: string) {
    this.selectedView = view;
  }

  getViewButtonClass(view: string): string {
    return `view-btn ${this.selectedView === view ? 'active' : ''}`;
  }

  calculateStats(field: keyof HealthData): Stats {
    const values = this.filteredData.map((d) => Number(d[field]));
    const sorted = [...values].sort((a, b) => a - b);

    return {
      current: values[values.length - 1] || 0,
      average: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
      median: sorted[Math.floor(sorted.length / 2)],
      max: Math.max(...values),
      min: Math.min(...values),
      total: parseFloat(values.reduce((a, b) => a + b, 0).toFixed(1)),
    };
  }

  calculateAllStats() {
    this.stepsStats = this.calculateStats('steps');
    this.caloriesStats = this.calculateStats('calories');
    this.distanceStats = this.calculateStats('distance');
    this.weightStats = this.calculateStats('weight');
  }

  getTrendPercentage(field: string): number {
    const stats = this.getStatsByField(field);
    return Math.abs(Math.floor(((stats.current - stats.average) / stats.average) * 100));
  }

  getTrendIndicator(field: string): string {
    const stats = this.getStatsByField(field);
    return stats.current >= stats.average ? '+' : field === 'weight' ? '' : '+';
  }

  getStatsByField(field: string): Stats {
    switch (field) {
      case 'steps':
        return this.stepsStats;
      case 'calories':
        return this.caloriesStats;
      case 'distance':
        return this.distanceStats;
      case 'weight':
        return this.weightStats;
      default:
        return this.stepsStats;
    }
  }

  getMaxValue(field: keyof HealthData): number {
    return Math.max(...this.filteredData.map((d) => Number(d[field])));
  }

  getDistanceProgress(): number {
    return Math.min((this.distanceStats.current / 10) * 100, 100);
  }

  getRecentData(): HealthData[] {
    return this.filteredData.slice(-7);
  }

  getMinWeight(): number {
    return Math.min(...this.getRecentData().map((d) => d.weight));
  }

  getMaxWeight(): number {
    return Math.max(...this.getRecentData().map((d) => d.weight));
  }

  getGoalAchievement(): number {
    return Math.floor(this.stepsStats.average / 100);
  }

  getTotalDistance(): number {
    return Math.round(this.distanceStats.total);
  }

  animateStepsValue() {
    const target = this.stepsStats.current;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      this.animatedValues.steps = Math.floor(target * progress);

      if (progress < 1) {
        // requestAnimationFrame(animate);
      }
    };

    animate();
  }

  onCardHover(cardType: string) {
    // Add hover effects if needed
  }

  onCardLeave(cardType: string) {
    // Remove hover effects if needed
  }
}
