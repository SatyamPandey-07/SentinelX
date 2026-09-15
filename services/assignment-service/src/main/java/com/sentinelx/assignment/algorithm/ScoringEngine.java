package com.sentinelx.assignment.algorithm;

import com.sentinelx.common.enums.IncidentCategory;
import com.sentinelx.common.enums.IncidentSeverity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScoringEngine {

    private final double distanceWeight;
    private final double skillWeight;
    private final double workloadWeight;

    public ScoringEngine(
            @Value("${assignment.weights.distance:0.45}") double distanceWeight,
            @Value("${assignment.weights.skill:0.35}") double skillWeight,
            @Value("${assignment.weights.workload:0.20}") double workloadWeight) {
        this.distanceWeight = distanceWeight;
        this.skillWeight = skillWeight;
        this.workloadWeight = workloadWeight;
    }

    /**
     * Calculates a composite suitability score [0.0 - 100.0] for a responder.
     * Higher score indicates better match.
     */
    public double calculateScore(
            double distanceMeters,
            List<String> responderSkills,
            int currentWorkload,
            IncidentCategory category,
            IncidentSeverity severity) {

        // 1. Distance Component: Max score 100 at 0m, degrades to 0 at 2000m
        double distanceScore = Math.max(0.0, 100.0 - (distanceMeters / 20.0));

        // 2. Skill Component: Exact skill match gives 100, adjacent gives 50, none gives 10
        double skillScore = 10.0;
        String requiredSkill = mapCategoryToSkill(category);
        for (String skill : responderSkills) {
            if (skill.trim().equalsIgnoreCase(requiredSkill)) {
                skillScore = 100.0;
                break;
            } else if (isCompatibleSkill(skill, requiredSkill)) {
                skillScore = Math.max(skillScore, 60.0);
            }
        }

        // 3. Workload Penalty: Max 100 with 0 active incidents, -25 per active incident
        double workloadScore = Math.max(0.0, 100.0 - (currentWorkload * 25.0));

        // Composite Weighted Score
        double finalScore = (distanceScore * distanceWeight) +
                            (skillScore * skillWeight) +
                            (workloadScore * workloadWeight);

        // Severity multiplier for critical emergencies (prioritize nearest available)
        if (severity == IncidentSeverity.CRITICAL && distanceMeters < 500) {
            finalScore += 10.0;
        }

        return Math.min(100.0, Math.max(0.0, finalScore));
    }

    private String mapCategoryToSkill(IncidentCategory category) {
        if (category == null) return "GENERAL_FIRST_AID";
        return switch (category) {
            case FIRE -> "FIRE";
            case HAZMAT -> "HAZMAT";
            case MEDICAL -> "MEDICAL";
            case SECURITY, SUSPICIOUS_ACTIVITY, HARASSMENT, THEFT -> "SECURITY";
            case INFRASTRUCTURE, ELECTRICAL, EQUIPMENT_FAILURE -> "STRUCTURAL";
            default -> "GENERAL_FIRST_AID";
        };
    }

    private boolean isCompatibleSkill(String skill, String required) {
        if ("FIRE".equalsIgnoreCase(required) && "HAZMAT".equalsIgnoreCase(skill)) return true;
        if ("MEDICAL".equalsIgnoreCase(required) && "GENERAL_FIRST_AID".equalsIgnoreCase(skill)) return true;
        return false;
    }
}
