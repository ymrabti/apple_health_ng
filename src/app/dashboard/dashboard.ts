import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, GlobalSummaryStats, UserInfos } from '../services/auth.service';
import { HealthService } from '../services/health.service';
import { SeoService } from '../services/seo.service';
import { MascotTipsService, TrendAnalysis } from '../services/mascot-tips.service';
import { formatDate } from './utils/date';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexDataLabels,
    ApexStroke,
    ApexYAxis,
    ApexGrid,
    ApexTooltip,
    ApexLegend,
    ApexFill,
    ChartComponent,
} from 'ng-apexcharts';
import { SocketEvent, WebsocketService } from '../services/websocket.service';
import { environment } from '../../environments/environment';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    yaxis: ApexYAxis;
    grid: ApexGrid;
    tooltip: ApexTooltip;
    legend: ApexLegend;
    fill: ApexFill;
    colors: string[];
};

interface HealthData {
    date: string;
    displayDate: string;
    steps: number;
    calories: number;
    distance: number;
    weight: number;
    fatLoss: number;
    activeCalories?: number;
    basalCalories?: number;
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
interface DualChartPoint {
    label: string;
    active: number;
    basal: number;
}
interface ActivityLevel {
    label: string;
    value: number; // percentage 0..100
    color: string;
}
interface ActivitySummary {
    date: string;
    activeEnergyBurned: number;
    activeEnergyBurnedGoal: number;
    appleMoveTime: number;
    appleMoveTimeGoal: number;
    appleExerciseTime: number;
    appleExerciseTimeGoal: number;
    appleStandHours: number;
    appleStandHoursGoal: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: false,
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
    private readonly KCAL_PER_KG = 7700;
    dateRange: string = environment.production ? '30d' : '7d';
    isProduction: boolean = environment.production;
    selectedView: string = 'daily';
    views: string[] = ['daily', 'weekly', 'trends'];
    navbarMinified = false;

    toggleNavbar(): void {
        this.navbarMinified = !this.navbarMinified;
        this.health.saveCollapsedState(this.navbarMinified);
    }

    healthData: HealthData[] = [];
    filteredData: HealthData[] = [];
    userInfo: UserInfos | null = null;
    // Custom date range inputs (YYYY-MM-DD)
    customFrom: string | null = null;
    customTo: string | null = null;

    // Monthly period chips (last 12 months)
    monthlyPeriods: Array<{ label: string; value: string; year: number; month: number }> = [];
    selectedMonthPeriod: string | null = null;

    stepsStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
    caloriesStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
    distanceStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
    weightStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
    fatLossStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
    activeCaloriesStats: Stats = { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
    globalStats: GlobalSummaryStats = {
        sumDistance: 0,
        goalAchievements: 0,
        daysTracked: 0,
        healthScore: 0,
        healthGrade: 'N/A',
        components: {
            activityScore: 0,
            stepsScore: 0,
            streakScore: 0,
        },
    };

    activityLevels: ActivityLevel[] = [];
    activityLevelsAll: ActivityLevel[] = [];
    activitySummaries: ActivitySummary[] = [];

    // ApexCharts options
    stepsChartOptions: Partial<ChartOptions> = this.getDefaultChartOptions();
    caloriesChartOptions: Partial<ChartOptions> = this.getDefaultChartOptions();
    activeBasalChartOptions: Partial<ChartOptions> = this.getDefaultChartOptions();
    metricGoalChartOptions: Partial<ChartOptions> = this.getDefaultChartOptions();

    // Chart type toggles
    stepsChartType: 'bar' | 'line' | 'area' = 'bar';
    caloriesChartType: 'bar' | 'line' | 'area' = 'area';
    activeBasalChartType: 'bar' | 'line' | 'area' = 'line';
    metricGoalChartType: 'bar' | 'line' | 'area' = 'line';

    // Colors for activity levels
    private readonly activityColors = {
        very: '#10B981',
        active: '#F59E0B',
        light: '#6B7280',
        sedentary: '#EF4444',
    };

    private getDefaultChartOptions(): Partial<ChartOptions> {
        return {
            series: [{ name: '', data: [] }],
            chart: {
                type: 'bar',
                height: 300,
                background: 'transparent',
                toolbar: { show: false },
                zoom: { enabled: false },
                selection: { enabled: false },
            },
            colors: ['#22d3ee'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: { categories: [], labels: { style: { colors: '#9ca3af' } }, tickAmount: 10 },
            yaxis: { labels: { style: { colors: '#9ca3af' } } },
            grid: { borderColor: 'rgba(55, 65, 81, 0.3)', strokeDashArray: 4 },
            tooltip: { theme: 'dark' },
            fill: { opacity: 1 },
        };
    }
    constructor(
        private auth: AuthService,
        private router: Router,
        private health: HealthService,
        private seo: SeoService,
        private mascotTipsService: MascotTipsService,
        private socket: WebsocketService
    ) {
        this.navbarMinified = this.health.getCollapsedState();
    }

    ngOnInit() {
        this.socket.onMessage<void>(SocketEvent.IMPORT_SUCCESS, (data) => {
            this.mascotTipsService.showTip({
                priority: 8,
                message: 'Health data import completed successfully!',
            });
            console.log('Import success message received via WebSocket', data);
            this.fetchDataForCurrentRange();
        });
        // Page-specific SEO
        this.seo.apply({
            title: 'Dashboard – Personalized Health Analytics',
            description:
                'View your Apple Health trends including steps, Calories, distance and goals.',
            type: 'website',
        });
        // Generate monthly periods for last 12 months
        this.generateMonthlyPeriods();
        // Fetch user infos (weight/height)
        this.health.getUserInfos().subscribe({
            next: (info) => {
                this.userInfo = (info as UserInfos) || null;
                this.applyUserInfoToWeights();
            },
            error: (err) => {
                console.error('Failed to load user infos', err);
            },
        });
        this.fetchDataForCurrentRange();
    }
    // Merged full-width chart view toggler
    mergedChartView: 'activeBasal' | 'metricGoal' = 'activeBasal';

    ngOnDestroy() {
        // Clean up any subscriptions or intervals
    }

    toggleStepsChartType(type: 'bar' | 'line' | 'area') {
        this.stepsChartType = type;
        this.updateStepsChart();
    }

    toggleCaloriesChartType(type: 'bar' | 'line' | 'area') {
        this.caloriesChartType = type;
        this.updateCaloriesChart();
    }

    toggleActiveBasalChartType(type: 'bar' | 'line' | 'area') {
        this.activeBasalChartType = type;
        this.updateActiveBasalChart();
    }

    toggleMetricGoalChartType(type: 'bar' | 'line' | 'area') {
        this.metricGoalChartType = type;
        this.updateMetricGoalChart();
    }

    private updateCharts() {
        this.updateStepsChart();
        this.updateCaloriesChart();
        this.updateActiveBasalChart();
        this.updateMetricGoalChart();
    }

    private updateStepsChart() {
        const data = this.getStepsChartData();
        this.stepsChartOptions = {
            series: [
                {
                    name: 'Steps',
                    data: data.map((d) => d.value),
                },
            ],
            chart: {
                type: this.stepsChartType,
                height: 300,
                background: 'transparent',
                toolbar: { show: false },
                animations: { enabled: true, speed: 800 },
                zoom: { enabled: false },
                selection: { enabled: false },
            },
            colors: ['#22d3ee'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: {
                categories: data.map((d) => d.label),
                tickAmount: 10,
                labels: {
                    style: { colors: '#9ca3af', fontSize: '11px' },
                    rotate: -45,
                    rotateAlways: false,
                },
            },
            yaxis: {
                labels: {
                    style: { colors: '#9ca3af' },
                },
            },
            grid: {
                borderColor: 'rgba(55, 65, 81, 0.3)',
                strokeDashArray: 4,
            },
            tooltip: {
                theme: 'dark',
                y: { formatter: (val: number) => `${val.toLocaleString()} steps` },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'vertical',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#a855f7'],
                    opacityFrom: 0.8,
                    opacityTo: 0.4,
                },
            },
        };
    }

    private updateCaloriesChart() {
        const data = this.getCaloriesChartData();
        this.caloriesChartOptions = {
            series: [
                {
                    name: 'Calories',
                    data: data.map((d) => d.value),
                },
            ],
            chart: {
                type: this.caloriesChartType,
                height: 300,
                background: 'transparent',
                toolbar: { show: false },
                animations: { enabled: true, speed: 800 },
                zoom: { enabled: false },
                selection: { enabled: false },
            },
            colors: ['#f59e0b'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: {
                categories: data.map((d) => d.label),
                tickAmount: 10,
                labels: {
                    style: { colors: '#9ca3af', fontSize: '11px' },
                    rotate: -45,
                },
            },
            yaxis: {
                labels: {
                    style: { colors: '#9ca3af' },
                    formatter: (val: number) => val.toFixed(2),
                },
            },
            grid: {
                borderColor: 'rgba(55, 65, 81, 0.3)',
                strokeDashArray: 4,
            },
            tooltip: {
                theme: 'dark',
                y: { formatter: (val: number) => `${val.toLocaleString()} kcal` },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'vertical',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#ef4444'],
                    opacityFrom: 0.7,
                    opacityTo: 0.1,
                },
            },
        };
    }

    private updateActiveBasalChart() {
        const data = this.getActiveBasalChartData();
        this.activeBasalChartOptions = {
            series: [
                { name: 'Active', data: data.map((d) => d.active) },
                { name: 'Basal', data: data.map((d) => d.basal) },
            ],
            chart: {
                type: this.activeBasalChartType,
                height: 300,
                background: 'transparent',
                toolbar: { show: false },
                zoom: { enabled: false },
                selection: { enabled: false },
            },
            colors: ['#22d3ee', '#a855f7'],
            dataLabels: { enabled: false },
            stroke: { curve: 'straight', width: 3 },
            xaxis: {
                categories: data.map((d) => d.label),
                tickAmount: 10,
                labels: {
                    style: { colors: '#9ca3af', fontSize: '11px' },
                    rotate: -45,
                },
            },
            yaxis: {
                labels: {
                    style: { colors: '#9ca3af' },
                    formatter: (val: number) => val.toFixed(2),
                },
            },
            grid: {
                borderColor: 'rgba(55, 65, 81, 0.3)',
                strokeDashArray: 4,
            },
            tooltip: {
                theme: 'dark',
                y: { formatter: (val: number) => `${val.toLocaleString()} kcal` },
            },
            legend: {
                labels: { colors: '#e5e7eb' },
                position: 'top',
            },
            fill: { opacity: 1 },
        };
    }

    private updateMetricGoalChart() {
        const data = this.getMetricGoalChartData(this.selectedActivityMetric);
        const unit = this.getMetricUnit(this.selectedActivityMetric);
        this.metricGoalChartOptions = {
            series: [
                { name: 'Achieved', data: data.map((d) => d.achieved) },
                { name: 'Goal', data: data.map((d) => d.goal) },
            ],
            chart: {
                type: this.metricGoalChartType,
                height: 300,
                background: 'transparent',
                toolbar: { show: false },
                zoom: { enabled: false },
                selection: { enabled: false },
            },
            colors: ['#10b981', '#f59e0b'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            xaxis: {
                categories: data.map((d) => d.label),
                tickAmount: 10,
                labels: {
                    style: { colors: '#9ca3af', fontSize: '11px' },
                    rotate: -45,
                },
            },
            yaxis: {
                labels: {
                    style: { colors: '#9ca3af' },
                    formatter: (val: number) => val.toFixed(2),
                },
            },
            grid: {
                borderColor: 'rgba(55, 65, 81, 0.3)',
                strokeDashArray: 4,
            },
            tooltip: {
                theme: 'dark',
                y: { formatter: (val: number) => `${val.toLocaleString()} ${unit}` },
            },
            legend: {
                labels: { colors: '#e5e7eb' },
                position: 'top',
            },
            fill: { opacity: 1 },
        };
    }

    private fetchDataForCurrentRange() {
        const { from: dateFrom, to: dateTo } = this.getDateRange();

        // Fetch global stats
        this.health.getFooterStats(dateFrom, dateTo).subscribe({
            next: (stats) => {
                this.globalStats = stats;
            },
            error: (err) => {
                console.error('Failed to load global stats', err);
            },
        });

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
                            weight: 0, // not provided by daily summaries; will be filled later if available
                            fatLoss: 0,
                            activeCalories: active,
                            basalCalories: basal,
                        } as HealthData;
                    })
                    .sort((a, b) => (a.date < b.date ? -1 : 1));

                this.healthData = mapped;
                this.filteredData = mapped;
                this.applyUserInfoToWeights();
                this.recomputeFatLoss();
                // Compute activity summaries for filtered and all data
                this.activityLevels = this.computeActivityLevels(this.filteredData);
                this.activityLevelsAll = this.computeActivityLevels(this.healthData);
                this.calculateAllStats();
                this.animateStepsValue();
                this.updateCharts();
            },
            error: (err) => {
                console.error('Failed to load daily summaries', err);
                this.healthData = [];
                this.filteredData = [];
                this.calculateAllStats();
            },
        });

        // Fetch activity summaries (Move/Exercise/Stand) including active energy goal
        this.health.getActivitySummaries(dateFrom, dateTo).subscribe({
            next: (res) => {
                const items = Array.isArray(res.items) ? res.items : [];
                this.activitySummaries = items
                    .map((it: any) => ({
                        date: String(it.dateComponents || it.date || ''),
                        activeEnergyBurned: Number(it.activeEnergyBurned || 0),
                        activeEnergyBurnedGoal: Number(it.activeEnergyBurnedGoal || 0),
                        appleMoveTime: Number(it.appleMoveTime || 0),
                        appleMoveTimeGoal: Number(it.appleMoveTimeGoal || 0),
                        appleExerciseTime: Number(it.appleExerciseTime || 0),
                        appleExerciseTimeGoal: Number(it.appleExerciseTimeGoal || 0),
                        appleStandHours: Number(it.appleStandHours || 0),
                        appleStandHoursGoal: Number(it.appleStandHoursGoal || 0),
                    }))
                    .sort((a, b) => (a.date < b.date ? -1 : 1));
            },
            error: (err) => {
                console.error('Failed to load activity summaries', err);
                this.activitySummaries = [];
            },
        });
    }

    onDateRangeChange() {
        // Defer until custom dates are set
        if (this.dateRange === 'custom') {
            return;
        }
        this.fetchDataForCurrentRange();
    }

    updateFilteredData() {
        this.filteredData = this.healthData;
        this.recomputeFatLoss();
        this.activityLevels = this.computeActivityLevels(this.filteredData);
        this.activityLevelsAll = this.computeActivityLevels(this.healthData);
    }

    // Compute from/to based on selected dateRange
    private getDateRange(): { from: string; to: string } {
        const today = new Date();
        const to = formatDate(today);
        let fromDate: Date | null = null;

        switch (this.dateRange) {
            case 'all': {
                return { from: '1970-01-01', to };
            }
            case 'year': {
                fromDate = new Date(today.getFullYear(), 0, 1);
                break;
            }
            case 'month': {
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            }
            case 'week': {
                const day = today.getDay(); // 0=Sun, 1=Mon
                const diffToMonday = (day + 6) % 7; // days since Monday
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - diffToMonday);
                break;
            }
            case 'custom': {
                // Use provided custom dates or fallback to last 7 days
                if (this.customFrom && this.customTo) {
                    const f = new Date(this.customFrom);
                    const t = new Date(this.customTo);
                    // Ensure ordering
                    if (f > t) {
                        return { from: formatDate(t), to: formatDate(f) };
                    }
                    return { from: formatDate(f), to: formatDate(t) };
                }
                const end = today;
                const start = new Date();
                start.setDate(end.getDate() - 6);
                return { from: formatDate(start), to };
            }
            default: {
                // Expect formats like '7d', '14d', '30d'
                const days = parseInt(this.dateRange.replace('d', '')) || 7;
                const start = new Date();
                start.setDate(today.getDate() - (days - 1));
                return { from: formatDate(start), to };
            }
        }
        const from = formatDate(fromDate!);
        return { from, to };
    }

    applyCustomRange() {
        if (!this.customFrom || !this.customTo) return;
        this.dateRange = 'custom';
        this.fetchDataForCurrentRange();
    }

    private generateMonthlyPeriods() {
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        const today = new Date();
        this.monthlyPeriods = [];

        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            const value = `${year}-${String(month + 1).padStart(2, '0')}`;

            this.monthlyPeriods.push({
                label: monthNames[month],
                value: value,
                year: year,
                month: month,
            });
        }
    }

    selectMonthPeriod(period: { label: string; value: string; year: number; month: number }) {
        this.selectedMonthPeriod = period.value;

        // Set date range to the selected month
        const firstDay = new Date(period.year, period.month, 1);
        const lastDay = new Date(period.year, period.month + 1, 0);

        this.customFrom = formatDate(firstDay);
        this.customTo = formatDate(lastDay);
        this.dateRange = 'custom';

        this.fetchDataForCurrentRange();
    }

    private applyUserInfoToWeights() {
        if (!this.userInfo || !this.healthData.length) return;
        const w = Number(this.userInfo?.weightInKilograms || this.userInfo.weightInKilograms || 0);
        if (!w) return;
        // Fill missing weight values in current range with the latest known weight
        this.healthData = this.healthData.map((d) => ({ ...d, weight: d.weight || w }));
        this.filteredData = this.filteredData.map((d) => ({ ...d, weight: d.weight || w }));
        // Update weight stats current directly when available
        this.weightStats.current = w;
    }

    private recomputeFatLoss() {
        if (!this.filteredData?.length) return;
        this.filteredData = this.filteredData.map((d) => {
            const activeCaloriesBurned = Number(d.activeCalories || 0);
            const fatLoss =
                activeCaloriesBurned > 0
                    ? parseFloat((activeCaloriesBurned / this.KCAL_PER_KG).toFixed(3))
                    : 0;
            return { ...d, fatLoss } as HealthData;
        });
    }

    // Compute activity summary levels from a dataset
    private computeActivityLevels(data: HealthData[]): ActivityLevel[] {
        const n = data?.length || 0;
        if (!n) {
            return [
                { label: 'Very Active', value: 0, color: this.activityColors.very },
                { label: 'Active', value: 0, color: this.activityColors.active },
                { label: 'Light Activity', value: 0, color: this.activityColors.light },
                { label: 'Sedentary', value: 0, color: this.activityColors.sedentary },
            ];
        }

        // Normalize scores using max across dataset
        const maxSteps = Math.max(...data.map((d) => Number(d.steps || 0)), 0);
        const maxDist = Math.max(...data.map((d) => Number(d.distance || 0)), 0);
        const maxActive = Math.max(...data.map((d) => Number(d.activeCalories || 0)), 0);

        const buckets = { very: 0, active: 0, light: 0, sedentary: 0 };
        for (const d of data) {
            const stepsNorm = maxSteps ? Number(d.steps || 0) / maxSteps : 0;
            const distNorm = maxDist ? Number(d.distance || 0) / maxDist : 0;
            const actNorm = maxActive ? Number(d.activeCalories || 0) / maxActive : 0;
            // Weighted composite score [0..100]
            const score = (0.5 * stepsNorm + 0.3 * distNorm + 0.2 * actNorm) * 100;
            if (score >= 70) buckets.very++;
            else if (score >= 50) buckets.active++;
            else if (score >= 30) buckets.light++;
            else buckets.sedentary++;
        }

        const toPct = (count: number) => Math.round((count / n) * 100);
        return [
            { label: 'Very Active', value: toPct(buckets.very), color: this.activityColors.very },
            { label: 'Active', value: toPct(buckets.active), color: this.activityColors.active },
            {
                label: 'Light Activity',
                value: toPct(buckets.light),
                color: this.activityColors.light,
            },
            {
                label: 'Sedentary',
                value: toPct(buckets.sedentary),
                color: this.activityColors.sedentary,
            },
        ];
    }

    // Chart helpers responding to selectedView and dateRange
    private chunkByWeeks<T>(list: T[]): T[][] {
        if (!list.length) return [];
        const chunks: T[][] = [];
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

    // Active vs Basal Calories dual series
    getActiveBasalChartData(): DualChartPoint[] {
        const data = this.filteredData;
        if (this.selectedView === 'weekly') {
            return this.chunkByWeeks(data).map((week, idx) => ({
                label: `Week ${idx + 1}`,
                active: week.reduce((s, d) => s + Number(d.activeCalories || 0), 0),
                basal: week.reduce((s, d) => s + Number(d.basalCalories || 0), 0),
            }));
        }
        if (this.selectedView === 'trends') {
            const a = data.map((d) => Number(d.activeCalories || 0));
            const b = data.map((d) => Number(d.basalCalories || 0));
            const aa = this.movingAverage(a, 7);
            const bb = this.movingAverage(b, 7);
            return data.map((d, i) => ({ label: d.displayDate, active: aa[i], basal: bb[i] }));
        }
        // daily
        return data.map((d) => ({
            label: d.displayDate,
            active: Number(d.activeCalories || 0),
            basal: Number(d.basalCalories || 0),
        }));
    }

    private getDualMax(): number {
        const arr = this.getActiveBasalChartData();
        if (!arr.length) return 0;
        return Math.max(...arr.map((p) => Math.max(Number(p.active || 0), Number(p.basal || 0))));
    }

    getChartTitle(kind: 'steps' | 'calories'): string {
        if (this.selectedView === 'weekly') {
            return kind === 'steps' ? 'Weekly Steps' : 'Weekly Calories';
        }
        if (this.selectedView === 'trends') {
            return kind === 'steps' ? '7-day Steps Avg' : '7-day Calories Avg';
        }
        return kind === 'steps' ? 'Steps Trend' : 'Calories Burned Trend';
    }

    getMaxChartValue(kind: 'steps' | 'calories'): number {
        const arr = kind === 'steps' ? this.getStepsChartData() : this.getCaloriesChartData();
        if (!arr.length) return 0;
        return Math.max(...arr.map((p) => Number(p.value || 0)));
    }

    // Limit label count to avoid overflow; keep ~12 labels and include last
    getLabelPoints(kind: 'steps' | 'calories'): ChartPoint[] {
        const src = kind === 'steps' ? this.getStepsChartData() : this.getCaloriesChartData();
        const maxLabels = 12;
        if (src.length <= maxLabels) return src;
        const step = Math.ceil(src.length / maxLabels);
        const sampled: ChartPoint[] = [];
        for (let i = 0; i < src.length; i += step) {
            sampled.push(src[i]);
        }
        // Ensure last label included
        if (sampled[sampled.length - 1] !== src[src.length - 1]) {
            sampled.push(src[src.length - 1]);
        }
        return sampled;
    }

    setSelectedView(view: string) {
        this.selectedView = view;
        this.updateCharts();
    }

    getViewButtonClass(view: string): string {
        return `view-btn ${this.selectedView === view ? 'active' : ''}`;
    }

    setMergedChartView(view: 'activeBasal' | 'metricGoal') {
        this.mergedChartView = view;
    }

    trackByIdx(index: number, _item: unknown) {
        return index;
    }

    calculateStats(field: keyof HealthData): Stats {
        const values = this.filteredData
            .map((d) => Number(d[field]) || 0)
            .filter((v) => Number.isFinite(v));
        const n = values.length;
        if (n === 0) {
            return { current: 0, average: 0, median: 0, max: 0, min: 0, total: 0 };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const total = sorted.reduce((a, b) => a + b, 0);
        const average = total / n;
        const median = n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        const max = sorted[n - 1];
        const min = sorted[0];
        const current = values[n - 1] || 0;

        return {
            current,
            average: parseFloat(average.toFixed(2)),
            median: parseFloat(median.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            min: parseFloat(min.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
        };
    }

    calculateAllStats() {
        this.stepsStats = this.calculateStats('steps');
        this.caloriesStats = this.calculateStats('calories');
        this.activeCaloriesStats = this.calculateStats('activeCalories');
        this.distanceStats = this.calculateStats('distance');
        this.weightStats = this.calculateStats('weight');
        this.fatLossStats = this.calculateStats('fatLoss');
    }

    getTrendPercentage(field: string): number {
        // Special handling for weight: compare last two data points to avoid division by zero
        const stats = this.getStatsByField(field);
        const avg = Number(stats.average || 0);
        const curr = Number(stats.current || 0);
        if (!avg) return 0;
        return Math.abs(Math.floor(((curr - avg) / avg) * 100));
    }

    getTrendIndicator(field: string): string {
        const stats = this.getStatsByField(field);
        return stats.current >= stats.average ? '+' : '-';
    }

    getStatsByField(field: string): Stats {
        switch (field) {
            case 'steps':
                return this.stepsStats;
            case 'calories':
                return this.caloriesStats;
            case 'activeCalories':
                return this.activeCaloriesStats;
            case 'distance':
                return this.distanceStats;
            case 'weight':
                return this.weightStats;
            case 'fatLoss':
                return this.fatLossStats;
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
        const recent = this.getRecentData().map((d) => Number(d.weight || 0));
        let min = Math.min(...recent);
        if (!isFinite(min) || isNaN(min)) {
            const w = Number(
                this.userInfo?.weightInKilograms || this.userInfo?.weightInKilograms || 0
            );
            return w ? w - 0.5 : 0;
        }
        return min;
    }

    getMaxWeight(): number {
        const recent = this.getRecentData().map((d) => Number(d.weight || 0));
        let max = Math.max(...recent);
        if (!isFinite(max) || isNaN(max)) {
            const w = Number(
                this.userInfo?.weightInKilograms || this.userInfo?.weightInKilograms || 0
            );
            return w ? w + 0.5 : 1;
        }
        // Avoid zero range which breaks percent calc in template
        const min = Math.min(...recent);
        if (max === min) {
            const base = Number(
                this.userInfo?.weightInKilograms || this.userInfo?.weightInKilograms || max || 0
            );
            return base + 0.5;
        }
        return max;
    }

    // Weight deltas based on current filtered range
    getInitialWeight(): number {
        // First non-zero weight in current filtered dataset
        const first = this.filteredData.find((d) => Number(d.weight || 0) > 0);
        const w = Number(first?.weight || 0);
        if (w) return parseFloat(w.toFixed(1));
        const fallback = Number(
            this.userInfo?.weightInKilograms || this.userInfo?.weightInKilograms || 0
        );
        return parseFloat((fallback || 0).toFixed(1));
    }

    getWeightLossKg(): number {
        const currentLoss = this.activeCaloriesStats.total / this.KCAL_PER_KG;
        const loss = currentLoss; // positive when weight decreased
        return parseFloat((loss || 0).toFixed(1));
    }

    getWeightLossPct(): number {
        const initial = this.getInitialWeight();
        if (!initial) return 0;
        const pct = (this.getWeightLossKg() / initial) * 100;
        return parseFloat((pct || 0).toFixed(2));
    }

    getGoalAchievement(): number {
        return (
            Math.floor((this.globalStats.goalAchievements / this.globalStats.daysTracked) * 100) ||
            0
        );
    }

    getTotalDistance(): number {
        return Math.round(this.globalStats.sumDistance * 10) / 10 || 0;
    }

    // Active vs Basal Calories split over the current filtered range
    getCaloriesSplitTotals(): { active: number; basal: number; total: number; activePct: number } {
        const a = this.filteredData.reduce((s, d) => s + Number(d.activeCalories || 0), 0);
        const b = this.filteredData.reduce((s, d) => s + Number(d.basalCalories || 0), 0);
        const total = a + b;
        const activePct = total ? (a / total) * 100 : 0;
        return {
            active: Math.round(a),
            basal: Math.round(b),
            total: Math.round(total),
            activePct: parseFloat(activePct.toFixed(1)),
        };
    }

    // Active Energy vs Goal over current range
    getActiveEnergyGoalTotals(): { burned: number; goal: number; pct: number } {
        const burned = this.activitySummaries.reduce(
            (s, d) => s + Number(d.activeEnergyBurned || 0),
            0
        );
        const goal = this.activitySummaries.reduce(
            (s, d) => s + Number(d.activeEnergyBurnedGoal || 0),
            0
        );
        const pct = goal ? (burned / goal) * 100 : 0;
        return {
            burned: Math.round(burned),
            goal: Math.round(goal),
            pct: parseFloat(pct.toFixed(1)),
        };
    }

    // Metric vs Goal chart (Energy/Move/Exercise/Stand)
    selectedActivityMetric:
        | 'activeEnergyBurned'
        | 'appleMoveTime'
        | 'appleExerciseTime'
        | 'appleStandHours' = 'activeEnergyBurned';
    setSelectedActivityMetric(
        m: 'activeEnergyBurned' | 'appleMoveTime' | 'appleExerciseTime' | 'appleStandHours'
    ) {
        this.selectedActivityMetric = m;
        this.updateMetricGoalChart();
    }
    // Weekly Rings grid (7 rows per week)
    selectedRingMetric:
        | 'activeEnergyBurned'
        | 'appleMoveTime'
        | 'appleExerciseTime'
        | 'appleStandHours' = 'activeEnergyBurned';
    setSelectedRingMetric(
        m: 'activeEnergyBurned' | 'appleMoveTime' | 'appleExerciseTime' | 'appleStandHours'
    ) {
        this.selectedRingMetric = m;
    }
    private getMetricGoalKey(
        metric: 'activeEnergyBurned' | 'appleMoveTime' | 'appleExerciseTime' | 'appleStandHours'
    ): keyof ActivitySummary {
        switch (metric) {
            case 'activeEnergyBurned':
                return 'activeEnergyBurnedGoal';
            case 'appleMoveTime':
                return 'appleMoveTimeGoal';
            case 'appleExerciseTime':
                return 'appleExerciseTimeGoal';
            case 'appleStandHours':
                return 'appleStandHoursGoal';
        }
    }
    getMetricUnit(
        metric: 'activeEnergyBurned' | 'appleMoveTime' | 'appleExerciseTime' | 'appleStandHours'
    ): string {
        if (metric === 'activeEnergyBurned') return 'kcal';
        if (metric === 'appleStandHours') return 'h';
        return 'min';
    }
    getWeeklyRingColumns(
        metric: 'activeEnergyBurned' | 'appleMoveTime' | 'appleExerciseTime' | 'appleStandHours'
    ): Array<Array<{ pct: number }>> {
        const data = this.activitySummaries || [];
        const goalKey = this.getMetricGoalKey(metric);
        const weeks = this.chunkByWeeks(data);
        return weeks.map((week) => {
            const days = week.map((d) => {
                const ach = Number((d as any)[metric] || 0);
                const goal = Number((d as any)[goalKey] || 0);
                const pct = goal ? Math.min(100, Math.max(0, (ach / goal) * 100)) : 0;
                return { pct: parseFloat(pct.toFixed(1)) };
            });
            while (days.length < 7) days.push({ pct: 0 });
            return days.slice(0, 7);
        });
    }
    getMetricGoalChartData(
        metric: 'activeEnergyBurned' | 'appleMoveTime' | 'appleExerciseTime' | 'appleStandHours'
    ): Array<{ label: string; achieved: number; goal: number }> {
        const data = this.activitySummaries;
        const goalKey = this.getMetricGoalKey(metric);
        if (this.selectedView === 'weekly') {
            return this.chunkByWeeks(data).map((week, idx) => ({
                label: `Week ${idx + 1}`,
                achieved: week.reduce((s, d) => s + Number((d as any)[metric] || 0), 0),
                goal: week.reduce((s, d) => s + Number((d as any)[goalKey] || 0), 0),
            }));
        }
        if (this.selectedView === 'trends') {
            const ach = data.map((d) => Number((d as any)[metric] || 0));
            const gol = data.map((d) => Number((d as any)[goalKey] || 0));
            const aa = this.movingAverage(ach, 7);
            const gg = this.movingAverage(gol, 7);
            return data.map((d, i) => ({ label: d.date, achieved: aa[i], goal: gg[i] }));
        }
        return data.map((d) => ({
            label: d.date,
            achieved: Number((d as any)[metric] || 0),
            goal: Number((d as any)[goalKey] || 0),
        }));
    }
    private getMetricGoalMax(
        metric: 'activeEnergyBurned' | 'appleMoveTime' | 'appleExerciseTime' | 'appleStandHours'
    ): number {
        const arr = this.getMetricGoalChartData(metric);
        if (!arr.length) return 0;
        return Math.max(...arr.map((p) => Math.max(Number(p.achieved || 0), Number(p.goal || 0))));
    }

    animateStepsValue() {
        const target = this.stepsStats.current;
        const duration = 1500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
                // requestAnimationFrame(animate);
            }
        };

        animate();
    }

    onCardHover(cardType: string) {
        let tip: string = '';
        let trend: TrendAnalysis;

        switch (cardType) {
            case 'steps':
                trend = this.analyzeTrend(this.filteredData.map((d) => d.steps));
                tip = this.mascotTipsService.getStepsTip(trend);
                break;
            case 'calories':
                trend = this.analyzeTrend(this.filteredData.map((d) => d.calories));
                tip = this.mascotTipsService.getCaloriesTip(trend);
                break;
            case 'distance':
                trend = this.analyzeTrend(this.filteredData.map((d) => d.distance));
                tip = this.mascotTipsService.getDistanceTip(trend);
                break;
            case 'weight':
                trend = this.analyzeTrend(
                    this.filteredData.map((d) => d.weight).filter((w) => w > 0)
                );
                tip = this.mascotTipsService.getWeightTip(trend);
                break;
            case 'flights':
                tip = this.mascotTipsService.getFlightsTip('general');
                break;
        }

        if (tip) {
            this.mascotTipsService.showTip({ message: tip, duration: 6000, priority: 8 });
        }
    }

    onCardLeave(cardType: string) {
        // Optionally hide tip when leaving card
        // this.mascotTipsService.hideTip();
    }

    onChartHover(chartType: string, element?: string) {
        let tip: string = '';

        if (element === 'title') {
            switch (chartType) {
                case 'steps':
                    tip = this.mascotTipsService.getStepsTip('general');
                    break;
                case 'calories':
                    tip = this.mascotTipsService.getCaloriesTip('general');
                    break;
                case 'distance':
                    tip = this.mascotTipsService.getDistanceTip('general');
                    break;
                case 'activity':
                    tip = this.mascotTipsService.getActivityTip('general');
                    break;
            }
        } else {
            tip = this.mascotTipsService.getChartTip(chartType);
        }

        if (tip) {
            this.mascotTipsService.showTip({ message: tip, duration: 5000, priority: 7 });
        }
    }

    onActivityRingHover(ringType: string) {
        const tip = this.mascotTipsService.getActivityTip(ringType);
        if (tip) {
            this.mascotTipsService.showTip({ message: tip, duration: 5000, priority: 7 });
        }
    }

    onFooterStatHover(statType: string) {
        const tip = this.mascotTipsService.getFooterStatTip(statType);
        if (tip) {
            this.mascotTipsService.showTip({ message: tip, duration: 6000, priority: 7 });
        }
    }

    private analyzeTrend(data: number[]): TrendAnalysis {
        if (data.length < 2) {
            return { direction: 'stable', percentage: 0 };
        }

        const validData = data.filter((v) => v > 0);
        if (validData.length < 2) {
            return { direction: 'stable', percentage: 0 };
        }

        const firstHalf = validData.slice(0, Math.floor(validData.length / 2));
        const secondHalf = validData.slice(Math.floor(validData.length / 2));

        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const percentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        const absPercentage = Math.abs(percentage);

        // Check for spikes and drops
        const avg = validData.reduce((a, b) => a + b, 0) / validData.length;
        const stdDev = Math.sqrt(
            validData.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / validData.length
        );

        const hasSpike = validData.some((v) => v > avg + 2 * stdDev);
        const hasDrop = validData.some((v) => v < avg - 2 * stdDev);

        // Calculate variability
        const coefficientOfVariation = (stdDev / avg) * 100;
        let variability: 'low' | 'medium' | 'high';
        if (coefficientOfVariation < 15) {
            variability = 'low';
        } else if (coefficientOfVariation < 30) {
            variability = 'medium';
        } else {
            variability = 'high';
        }

        let direction: 'up' | 'down' | 'stable';
        if (absPercentage < 5) {
            direction = 'stable';
        } else if (percentage > 0) {
            direction = 'up';
        } else {
            direction = 'down';
        }

        return {
            direction,
            percentage: Math.round(absPercentage),
            hasSpike,
            hasDrop,
            variability,
        };
    }

    logout() {
        this.auth.signOut().subscribe({
            next: () => {
                this.router.navigate(['/signin'], {
                    replaceUrl: true,
                    queryParams: { redirect: '/home' },
                });
            },
            error: () => {
                // Even on error, navigate to signin
                this.router.navigate(['/signin'], {
                    replaceUrl: true,
                    queryParams: { redirect: '/home' },
                });
            },
        });
    }

    getUserPhotoUrl(): string {
        if (!this.userInfo?.userName || !this.userInfo?.photo) {
            return 'assets/default-avatar.svg';
        }
        return `${environment.apiBase}/account/photo`;
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'assets/default-avatar.svg';
    }
}
