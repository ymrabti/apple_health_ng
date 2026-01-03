import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
} from '@angular/core';

declare var particlesJS: any;
@Component({
    selector: 'app-particles',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './particles.html',
    styleUrl: './particles.scss',
})
export class Particles implements OnInit {
    constructor(private changeDetectorRef: ChangeDetectorRef) {
        changeDetectorRef.detach();
    }

    ngOnInit(): void {
        particlesJS.load('particles-js');
        this.changeDetectorRef.detectChanges();
    }
}
