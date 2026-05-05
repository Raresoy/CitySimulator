import { describe, it, expect } from 'vitest';
import { trafficAgentDecision } from '../agents/trafficAgent';

describe('Traffic Manager Agent', () => {
    it('ar trebui să detecteze congestia și să redirecționeze traficul', () => {
        const mockCityState = {
            roads: [{ id: 1, name: 'Bulevardul Unirii', congestionLevel: 85 }]
        };
        const decision = trafficAgentDecision(mockCityState);
        expect(decision.action).toBe('DIVERT_TRAFFIC');
    });

    it('ar trebui să mențină fluxul dacă traficul este liber', () => {
        const mockCityState = {
            roads: [{ id: 1, name: 'Bulevardul Unirii', congestionLevel: 40 }]
        };
        const decision = trafficAgentDecision(mockCityState);
        expect(decision.action).toBe('MAINTAIN');
    });
});