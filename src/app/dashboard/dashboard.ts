import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HealthService } from '../services/health.service';
import { formatDate } from './utils/date';

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

interface ChartPoint {
  label: string;
  value: number;
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

  // API health state
  apiHealthy: boolean | null = null;
  apiMessage: string = '';

  activityLevels = [
    { label: 'Very Active', value: 85, color: '#10B981' },
    { label: 'Active', value: 65, color: '#F59E0B' },
    { label: 'Light Activity', value: 45, color: '#6B7280' },
    { label: 'Sedentary', value: 25, color: '#EF4444' },
  ];

  constructor(private auth: AuthService, private router: Router, private health: HealthService) {}

  ngOnInit() {
    // Check backend connectivity (requires authentication)
    this.health.check().subscribe({
      next: (res) => {
        this.apiHealthy = typeof res === 'string' ? res.toUpperCase().includes('OK') : false;
        this.apiMessage = res || '';
      },
      error: (err) => {
        this.apiHealthy = false;
        this.apiMessage = (err?.error as string) || 'Unavailable';
      },
    });

    this.fetchDataForCurrentRange();
  }

  ngOnDestroy() {
    // Clean up any subscriptions or intervals
  }

  private fetchDataForCurrentRange() {
    const days = parseInt(this.dateRange.replace('d', ''));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const dateFrom = formatDate(start); // YYYY-MM-DD
    const dateTo = formatDate(end);

    this.health.getDailySummaries(dateFrom, dateTo).subscribe({
      next: (res) => {
        const items = Array.isArray(res.items) ? res.items : [];
        // Map backend records to UI HealthData
        const mapped: HealthData[] = items
          .map((it: any) => {
            const d = new Date(it.date);
            const displayDate = d.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            const steps = Number(it.steps) || 0;
            const distance = Number(it.distance) || 0;
            const active = Number(it.active) || 0;
            const basal = Number(it.basal) || 0;
            const calories = active + basal;
            return {
              date: formatDate(d),
              displayDate,
              steps,
              calories,
              distance,
              weight: 0, // not provided by daily summaries; keep placeholder
              fatLoss: 0,
            } as HealthData;
          })
          .sort((a, b) => (a.date < b.date ? -1 : 1));

        this.healthData = mapped;
        this.filteredData = mapped;
        this.calculateAllStats();
        this.animateStepsValue();
      },
      error: (err) => {
        console.error('Failed to load daily summaries', err);
        this.healthData = [];
        this.filteredData = [];
        this.calculateAllStats();
      },
    });
  }

  onDateRangeChange() {
    this.fetchDataForCurrentRange();
  }

  updateFilteredData() {
    this.filteredData = this.healthData;
  }

  // Chart helpers responding to selectedView and dateRange
  private chunkByWeeks(list: HealthData[]): HealthData[][] {
    if (!list.length) return [];
    const chunks: HealthData[][] = [];
    for (let i = 0; i < list.length; i += 7) {
      chunks.push(list.slice(i, i + 7));
    }
    return chunks;
  }

  private movingAverage(list: number[], window = 7): number[] {
    if (!list.length) return [];
    const out: number[] = [];
    for (let i = 0; i < list.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = list.slice(start, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      out.push(Number(avg.toFixed(1)));
    }
    return out;
  }

  getStepsChartData(): ChartPoint[] {
    const data = this.filteredData;
    if (this.selectedView === 'weekly') {
      return this.chunkByWeeks(data).map((week, idx) => ({
        label: `Week ${idx + 1}`,
        value: week.reduce((sum, d) => sum + Number(d.steps || 0), 0),
      }));
    }
    if (this.selectedView === 'trends') {
      const values = data.map((d) => Number(d.steps || 0));
      const avgs = this.movingAverage(values, 7);
      return data.map((d, i) => ({ label: d.displayDate, value: avgs[i] }));
    }
    // daily
    return data.map((d) => ({ label: d.displayDate, value: Number(d.steps || 0) }));
  }

  getCaloriesChartData(): ChartPoint[] {
    const data = this.filteredData;
    if (this.selectedView === 'weekly') {
      return this.chunkByWeeks(data).map((week, idx) => ({
        label: `Week ${idx + 1}`,
        value: week.reduce((sum, d) => sum + Number(d.calories || 0), 0),
      }));
    }
    if (this.selectedView === 'trends') {
      const values = data.map((d) => Number(d.calories || 0));
      const avgs = this.movingAverage(values, 7);
      return data.map((d, i) => ({ label: d.displayDate, value: avgs[i] }));
    }
    // daily
    return data.map((d) => ({ label: d.displayDate, value: Number(d.calories || 0) }));
  }

  getChartTitle(kind: 'steps' | 'calories'): string {
    if (this.selectedView === 'weekly') {
      return kind === 'steps' ? 'Weekly Steps' : 'Weekly Calories';
    }
    if (this.selectedView === 'trends') {
      return kind === 'steps' ? '7-day Steps Avg' : '7-day Calories Avg';
    }
    return kind === 'steps' ? 'Steps Trend' : 'Calories Burned';
  }

  getMaxChartValue(kind: 'steps' | 'calories'): number {
    const arr = kind === 'steps' ? this.getStepsChartData() : this.getCaloriesChartData();
    if (!arr.length) return 0;
    return Math.max(...arr.map((p) => Number(p.value || 0)));
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

  logout() {
    this.auth.signOut();
    this.router.navigate(['/signin'], { queryParams: { redirect: '/home' } });
  }
}
