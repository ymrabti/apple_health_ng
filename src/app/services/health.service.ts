import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GlobalSummaryStats } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HealthService {
    constructor(private http: HttpClient) {}

    getUserInfos(): Observable<any> {
        return this.http.get<any>(`${environment.apiBase}/apple-health/user-infos`);
    }

    getDailySummaries(dateFrom: string, dateTo: string): Observable<{ ok: boolean; items: any[] }> {
        const params = new HttpParams().set('dateFrom', dateFrom).set('dateTo', dateTo);
        return this.http.get<{ ok: boolean; items: any[] }>(
            `${environment.apiBase}/apple-health/daily-summaries`,
            { params }
        );
    }

    getActivitySummaries(
        dateFrom: string,
        dateTo: string
    ): Observable<{ ok: boolean; items: any[] }> {
        const params = new HttpParams().set('dateFrom', dateFrom).set('dateTo', dateTo);
        return this.http.get<{ ok: boolean; items: any[] }>(
            `${environment.apiBase}/apple-health/activity-summaries`,
            { params }
        );
    }

    getFooterStats(
        dateFrom: string,
        dateTo: string
    ): Observable<GlobalSummaryStats> {
        const params = new HttpParams().set('dateFrom', dateFrom).set('dateTo', dateTo);
        return this.http.get<GlobalSummaryStats>(
            `${environment.apiBase}/apple-health/stats-summaries`,
            { params }
        );
    }

    uploadHealthExport(file: File): Observable<HttpEvent<any>> {
        const formData = new FormData();
        formData.append('file', file, file.name || 'export.zip');
        return this.http.post(`${environment.apiBase}/apple-health/import`, formData, {
            observe: 'events',
            reportProgress: true,
        });
    }
}
