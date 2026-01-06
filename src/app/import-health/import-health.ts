import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { HealthService } from '../services/health.service';
import { SeoService } from '../services/seo.service';

@Component({
    selector: 'app-import-health',
    templateUrl: './import-health.html',
    styleUrl: './import-health.scss',
    standalone: false,
})
export class ImportHealth {
    file: File | null = null;
    dragging = false;
    uploading = false;
    progress = 0;
    status: string | null = null;
    error: string | null = null;

    constructor(private health: HealthService, private router: Router, private seo: SeoService) {
        this.seo.apply({
            title: 'Import Apple Health Export',
            description: 'Upload your Apple Health export.xml or export.zip to populate your dashboard.',
            type: 'website',
        });
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.dragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.dragging = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.dragging = false;
        const file = event.dataTransfer?.files?.[0];
        this.setFile(file || null);
    }

    onFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.setFile(file);
    }

    private setFile(file: File | null) {
        this.error = null;
        this.status = null;
        this.progress = 0;
        this.file = file;
    }

    upload() {
        if (!this.file) {
            this.error = 'Choose an Apple Health export.xml or export.zip file.';
            return;
        }
        this.uploading = true;
        this.progress = 0;
        this.error = null;
        this.status = null;

        this.health.uploadHealthExport(this.file).subscribe({
            next: (event: HttpEvent<any>) => {
                if (event.type === HttpEventType.UploadProgress && event.total) {
                    this.progress = Math.round((100 * event.loaded) / event.total);
                }
                if (event.type === HttpEventType.Response) {
                    this.uploading = false;
                    this.progress = 100;
                    this.status = event.body?.message || 'Import completed. We are syncing your data now.';
                    setTimeout(() => {
                        this.router.navigateByUrl('/dashboard');
                    }, 1000);
                }
            },
            error: (err) => {
                this.uploading = false;
                this.error = err?.error?.message || 'Import failed. Please try again.';
            },
        });
    }

    goBack() {
        this.router.navigateByUrl('/home');
    }
}
