export function emergencyAgentDecision(incident, cityState) {
    if (!incident) return { action: "STANDBY", message: "Nicio urgență activă." };

    return {
        action: "DISPATCH_AMBULANCE",
        targetLocation: incident.location,
        requestTrafficPriority: true,
        message: `Urgență (${incident.type}) la ${incident.location}. Ambulanță trimisă. Se solicită verde la semafoare pe traseu.`
    };
}