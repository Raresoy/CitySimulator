import { describe, it, expect } from 'vitest';
import { emergencyAgentDecision } from '../agents/emergencyAgent';

describe('Emergency Response Agent', () => {
    it('ar trebui să trimită o ambulanță când apare un incident', () => {
        const incident = { type: 'ACCIDENT', location: 'Intersecția 3' };
        const decision = emergencyAgentDecision(incident, {});
        expect(decision.action).toBe('DISPATCH_AMBULANCE');
        expect(decision.requestTrafficPriority).toBe(true);
    });
});