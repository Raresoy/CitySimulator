export function energyAgentDecision(cityState) {
    if (!cityState || !cityState.energyLevel) {
        return { action: "NONE", message: "Aștept date despre rețeaua electrică..." };
    }

    // Dacă consumul depășește 90% din capacitate, luăm măsuri
    if (cityState.energyLevel > 90) {
        return {
            action: "REDUCE_POWER",
            target: "NON_ESSENTIAL",
            message: "Consum critic de energie (>90%)! Se reduce iluminatul public pentru a prioritiza spitalele."
        };
    }

    return { action: "NORMAL", message: "Rețeaua electrică este stabilă." };
}