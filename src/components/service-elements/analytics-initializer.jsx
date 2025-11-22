"use client"

import { useEffect } from 'react';
import heylock from '../../lib/sdk/src/index';

export function AnalyticsInitializer() {
    useEffect(() => {
        heylock.initialize('ce508b34255831f7c9bd9162fee2146fa5edb53b88cc24270a2b86ef4ad472ab', { requireBrowserEnvironment: true, tags: ['development', 'myself'] });
        // heylock.identifyUser('DEVELOPER');
    }, []);
}