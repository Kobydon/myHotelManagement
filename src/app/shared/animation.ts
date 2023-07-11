// import { triggerAsyncId } from 'async_hooks';
import { trigger, transition, style, query, animate, group } from "@angular/animations";

export const fadeAnimation = trigger('fadeAnimation', [
    // The '* => *' will trigger the animation to change between any two states
    transition('*=>*', [
        query(
            ':enter',
            [style({ opacity: 0 })],
            { optional: true }
        ),
        query(
            ':enter',
            [style({ opacity: 0 }), animate('0.4s', style({ opacity: 1 }))]
        )
    ])
]);

export const slideAnimation = trigger('slideAnimation', [
    transition('*=>*', [
        query(':enter,:leave', [
            style({ position: 'fixed', width: '100%' })
        ], { optional: true })
    ]),
    group([ //block executes in parallel
        query(':enter',
            [style({ position: 'fixed', width: '100%' })], { optional: true }),
        query(':leave',
            [style({ transform: 'translateX(0%)' })]),
        query(':leave',
            [style({ transform: 'translateX(0%)' }), animate('0.5s ease-in-out', style({ transform: 'translateX(-100%)' }))], { optional: true })
    ]),
]);

export const routeAnimations = trigger('routeAnimations', [
    transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('0.7s ease-in', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [
        animate('0.7s ease-in', style({ transform: 'translateX(-100%)' }))
    ])
]);

export const componentSlide = trigger('componentSlide', [
    transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('0.4s ease-in', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [
        animate('0.4s ease-in', style({ transform: 'translateX(-100%)' }))
    ])
]);
