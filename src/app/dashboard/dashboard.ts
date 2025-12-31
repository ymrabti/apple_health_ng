import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, GlobalSummaryStats, UserInfos } from '../services/auth.service';
import { HealthService } from '../services/health.service';
import { SeoService } from '../services/seo.service';
import { formatDate } from './utils/date';

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
type ChartType = 'column' | 'line' | 'area';
@Component({
    selector: 'app-dashboard',
    standalone: false,
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
    private readonly KCAL_PER_KG = 7700;
    dateRange: string = '7d';
    selectedView: string = 'daily';
    views: string[] = ['daily', 'weekly', 'trends'];

    healthData: HealthData[] = [];
    filteredData: HealthData[] = [];
    userInfo: UserInfos | null = null;
    // Custom date range inputs (YYYY-MM-DD)
    customFrom: string | null = null;
    customTo: string | null = null;

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

    // Colors for activity levels
    private readonly activityColors = {
        very: '#10B981',
        active: '#F59E0B',
        light: '#6B7280',
        sedentary: '#EF4444',
    };

    // Tooltip state for charts
    tooltip = {
        steps: { visible: false, label: '', value: 0, left: 0, top: 0 },
        calories: { visible: false, label: '', value: 0, left: 0, top: 0 },
        activeBasal: { visible: false, label: '', active: 0, basal: 0, left: 0, top: 0 },
        metricGoal: { visible: false, label: '', achieved: 0, goal: 0, left: 0, top: 0 },
    };

    constructor(
        private auth: AuthService,
        private router: Router,
        private health: HealthService,
        private seo: SeoService
    ) {}

    ngOnInit() {
        // Page-specific SEO
        this.seo.apply({
            title: 'Dashboard – Personalized Health Analytics',
            description:
                'View your Apple Health trends including steps, Calories, distance and goals.',
            type: 'website',
        });
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

    private getXYActiveBasal(which: 'active' | 'basal'): Array<{ x: number; y: number }> {
        const series = this.getActiveBasalChartData();
        const max = this.getDualMax() || 1;
        const n = series.length;
        if (n === 0) return [];
        if (n === 1) {
            const v = Math.min(100, Math.max(0, (series[0][which] / max) * 100));
            return [{ x: 0, y: 100 - v }];
        }
        return series.map((pt, i) => {
            const x = (i / (n - 1)) * 100;
            const v = Math.min(100, Math.max(0, ((pt[which] as number) / max) * 100));
            const y = 100 - v;
            return { x, y };
        });
    }
    getSvgLinePointsActiveBasal(which: 'active' | 'basal'): string {
        const xy = this.getXYActiveBasal(which);
        return xy.map((p) => `${p.x},${p.y}`).join(' ');
    }

    // Labels sampling for dual chart
    getActiveBasalLabelPoints(): ChartPoint[] {
        const src = this.getActiveBasalChartData().map((d) => ({ label: d.label, value: 0 }));
        const maxLabels = 12;
        if (src.length <= maxLabels) return src;
        const step = Math.ceil(src.length / maxLabels);
        const sampled: ChartPoint[] = [];
        for (let i = 0; i < src.length; i += step) sampled.push(src[i]);
        if (sampled[sampled.length - 1] !== src[src.length - 1]) sampled.push(src[src.length - 1]);
        return sampled;
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

    // Chart type state per chart
    stepsChartType: ChartType = 'column';
    caloriesChartType: ChartType = 'column';

    setStepsChartType(t: ChartType) {
        this.stepsChartType = t;
    }
    setCaloriesChartType(t: ChartType) {
        this.caloriesChartType = t;
    }

    // SVG helpers for line/area charts (normalized to 0..100 viewBox)
    private getSeries(kind: 'steps' | 'calories'): ChartPoint[] {
        return kind === 'steps' ? this.getStepsChartData() : this.getCaloriesChartData();
    }
    private getXY(kind: 'steps' | 'calories'): Array<{ x: number; y: number }> {
        const series = this.getSeries(kind);
        const max = this.getMaxChartValue(kind) || 1;
        const n = series.length;
        if (n === 0) return [];
        if (n === 1) {
            const v = Math.min(100, Math.max(0, (series[0].value / max) * 100));
            return [{ x: 0, y: 100 - v }];
        }
        return series.map((pt, i) => {
            const x = (i / (n - 1)) * 100;
            const v = Math.min(100, Math.max(0, (pt.value / max) * 100));
            const y = 100 - v; // invert for SVG coordinate system
            return { x, y };
        });
    }
    getSvgLinePoints(kind: 'steps' | 'calories'): string {
        const xy = this.getXY(kind);
        return xy.map((p) => `${p.x},${p.y}`).join(' ');
    }
    getSvgAreaPoints(kind: 'steps' | 'calories'): string {
        const xy = this.getXY(kind);
        if (xy.length === 0) return '';
        if (xy.length === 1) {
            const p = xy[0];
            return `0,100 ${p.x},${p.y} 0,100`;
        }
        const start = `0,100`;
        const mid = xy.map((p) => `${p.x},${p.y}`).join(' ');
        const end = `100,100`;
        return `${start} ${mid} ${end}`;
    }

    // Stable identity for *ngFor to prevent re-render animations
    trackByIdx(index: number, _item: unknown) {
        return index;
    }

    // Tooltip handlers for column bars
    showBarTooltip(kind: 'steps' | 'calories', idx: number, ev: MouseEvent) {
        const series = this.getSeries(kind);
        const barEl = ev.currentTarget as HTMLElement;
        const bars = barEl.parentElement as HTMLElement; // .chart-bars
        const wrapper = barEl.closest('.simple-chart') as HTMLElement; // positioned container
        if (!bars || !wrapper) return;
        const barRect = barEl.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const top = Math.max(0, barRect.top - wrapperRect.top - 12);
        const left =
            barRect.left - wrapperRect.left + barEl.offsetWidth / 2 + (wrapper.scrollLeft || 0);
        const point = series[idx];
        const tgt = this.tooltip[kind];
        tgt.visible = true;
        tgt.label = point?.label ?? '';
        tgt.value = Number(point?.value ?? 0);
        tgt.left = left;
        tgt.top = top;
    }

    hideBarTooltip(kind: 'steps' | 'calories') {
        const tgt = this.tooltip[kind];
        tgt.visible = false;
    }

    // Tooltip for SVG charts (line/area)
    onSvgMove(kind: 'steps' | 'calories', ev: MouseEvent) {
        const series = this.getSeries(kind);
        const svg = ev.currentTarget as SVGElement;
        const wrapper = svg.closest('.simple-chart') as HTMLElement;
        if (!wrapper || !series.length) return;
        const svgRect = svg.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const relX = ev.clientX - svgRect.left;
        const pctX = Math.min(1, Math.max(0, relX / svgRect.width));
        const i = Math.round(pctX * (series.length - 1));
        const max = this.getMaxChartValue(kind) || 1;
        const value = Number(series[i]?.value ?? 0);
        const vPct = Math.min(100, Math.max(0, (value / max) * 100));
        const top = Math.max(0, svgRect.height * (1 - vPct / 100) - 12);
        const left =
            svgRect.left - wrapperRect.left + pctX * svgRect.width + (wrapper.scrollLeft || 0);
        const tgt = this.tooltip[kind];
        tgt.visible = true;
        tgt.label = series[i]?.label ?? '';
        tgt.value = value;
        tgt.left = left;
        tgt.top = top;
    }

    onSvgLeave(kind: 'steps' | 'calories') {
        const tgt = this.tooltip[kind];
        tgt.visible = false;
    }

    // Tooltip for dual series chart
    onSvgMoveDual(ev: MouseEvent) {
        const series = this.getActiveBasalChartData();
        const svg = ev.currentTarget as SVGElement;
        const wrapper = svg.closest('.simple-chart') as HTMLElement;
        if (!wrapper || !series.length) return;
        const svgRect = svg.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const relX = ev.clientX - svgRect.left;
        const pctX = Math.min(1, Math.max(0, relX / svgRect.width));
        const i = Math.round(pctX * (series.length - 1));
        const max = this.getDualMax() || 1;
        const a = Number(series[i]?.active ?? 0);
        const b = Number(series[i]?.basal ?? 0);
        const vPct = Math.max(
            Math.min(100, Math.max(0, (a / max) * 100)),
            Math.min(100, Math.max(0, (b / max) * 100))
        );
        const top = Math.max(0, svgRect.height * (1 - vPct / 100) - 12);
        const left =
            svgRect.left - wrapperRect.left + pctX * svgRect.width + (wrapper.scrollLeft || 0);
        const tgt = this.tooltip.activeBasal;
        tgt.visible = true;
        tgt.label = series[i]?.label ?? '';
        tgt.active = a;
        tgt.basal = b;
        tgt.left = left;
        tgt.top = top;
    }
    onSvgLeaveDual() {
        this.tooltip.activeBasal.visible = false;
    }

    setSelectedView(view: string) {
        this.selectedView = view;
    }

    getViewButtonClass(view: string): string {
        return `view-btn ${this.selectedView === view ? 'active' : ''}`;
    }

    setMergedChartView(view: 'activeBasal' | 'metricGoal') {
        this.mergedChartView = view;
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
    }
    // Weekly Rings grid (7 rows per week)
    selectedRingMetric:
        | 'activeEnergyBurned'
        | 'appleMoveTime'
        | 'appleExerciseTime'
        | 'appleStandHours' = 'appleMoveTime';
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
    private getXYMetricGoal(which: 'achieved' | 'goal'): Array<{ x: number; y: number }> {
        const series = this.getMetricGoalChartData(this.selectedActivityMetric);
        const max = this.getMetricGoalMax(this.selectedActivityMetric) || 1;
        const n = series.length;
        if (n === 0) return [];
        if (n === 1) {
            const v = Math.min(100, Math.max(0, ((series[0] as any)[which] / max) * 100));
            return [{ x: 0, y: 100 - v }];
        }
        return series.map((pt, i) => {
            const x = (i / (n - 1)) * 100;
            const v = Math.min(100, Math.max(0, (((pt as any)[which] as number) / max) * 100));
            const y = 100 - v;
            return { x, y };
        });
    }
    getSvgLinePointsMetricGoal(which: 'achieved' | 'goal'): string {
        const xy = this.getXYMetricGoal(which);
        return xy.map((p) => `${p.x},${p.y}`).join(' ');
    }
    getMetricGoalLabelPoints(): ChartPoint[] {
        const src = this.getMetricGoalChartData(this.selectedActivityMetric).map((d) => ({
            label: d.label,
            value: 0,
        }));
        const maxLabels = 12;
        if (src.length <= maxLabels) return src;
        const step = Math.ceil(src.length / maxLabels);
        const sampled: ChartPoint[] = [];
        for (let i = 0; i < src.length; i += step) sampled.push(src[i]);
        if (sampled[sampled.length - 1] !== src[src.length - 1]) sampled.push(src[src.length - 1]);
        return sampled;
    }
    onSvgMoveMetricGoal(ev: MouseEvent) {
        const series = this.getMetricGoalChartData(this.selectedActivityMetric);
        const svg = ev.currentTarget as SVGElement;
        const wrapper = svg.closest('.simple-chart') as HTMLElement;
        if (!wrapper || !series.length) return;
        const svgRect = svg.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const relX = ev.clientX - svgRect.left;
        const pctX = Math.min(1, Math.max(0, relX / svgRect.width));
        const i = Math.round(pctX * (series.length - 1));
        const max = this.getMetricGoalMax(this.selectedActivityMetric) || 1;
        const a = Number(series[i]?.achieved ?? 0);
        const g = Number(series[i]?.goal ?? 0);
        const vPct = Math.max(
            Math.min(100, Math.max(0, (a / max) * 100)),
            Math.min(100, Math.max(0, (g / max) * 100))
        );
        const top = Math.max(0, svgRect.height * (1 - vPct / 100) - 12);
        const left =
            svgRect.left - wrapperRect.left + pctX * svgRect.width + (wrapper.scrollLeft || 0);
        const tgt = this.tooltip.metricGoal;
        tgt.visible = true;
        tgt.label = series[i]?.label ?? '';
        tgt.achieved = a;
        tgt.goal = g;
        tgt.left = left;
        tgt.top = top;
    }
    onSvgLeaveMetricGoal() {
        this.tooltip.metricGoal.visible = false;
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
