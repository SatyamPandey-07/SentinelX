package com.sentinelx.location.service;

import com.sentinelx.location.entity.CampusZoneEntity;
import com.sentinelx.location.entity.ResponderEntity;
import com.sentinelx.location.repository.CampusZoneRepository;
import com.sentinelx.location.repository.ResponderRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class LocationService {

    private static final double EARTH_RADIUS_METERS = 6371000.0;
    private static final double AVERAGE_WALKING_SPEED_MPS = 1.4; // 5 km/h in meters/sec

    private final ResponderRepository responderRepository;
    private final CampusZoneRepository campusZoneRepository;

    public LocationService(ResponderRepository responderRepository, CampusZoneRepository campusZoneRepository) {
        this.responderRepository = responderRepository;
        this.campusZoneRepository = campusZoneRepository;
    }

    public double calculateHaversineDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    public double estimateTravelSeconds(double distanceMeters) {
        return distanceMeters / AVERAGE_WALKING_SPEED_MPS;
    }

    public List<ResponderCandidate> findNearestAvailableResponders(
            double incidentLat,
            double incidentLon,
            int maxResults,
            double maxRadiusMeters,
            List<String> requiredSkills) {

        List<ResponderEntity> available = responderRepository.findByStatus("AVAILABLE");

        return available.stream()
                .filter(r -> {
                    if (requiredSkills == null || requiredSkills.isEmpty()) return true;
                    String[] skills = r.getSkills().split(",");
                    for (String req : requiredSkills) {
                        for (String skill : skills) {
                            if (skill.trim().equalsIgnoreCase(req.trim())) return true;
                        }
                    }
                    return false;
                })
                .map(r -> {
                    double dist = calculateHaversineDistanceMeters(incidentLat, incidentLon, r.getLatitude(), r.getLongitude());
                    return new ResponderCandidate(r, dist);
                })
                .filter(c -> maxRadiusMeters <= 0 || c.distanceMeters() <= maxRadiusMeters)
                .sorted(Comparator.comparingDouble(ResponderCandidate::distanceMeters))
                .limit(maxResults > 0 ? maxResults : 10)
                .toList();
    }

    public Optional<CampusZoneEntity> findZoneForCoordinates(double lat, double lon) {
        return campusZoneRepository.findAll().stream()
                .filter(z -> z.contains(lat, lon))
                .findFirst();
    }

    public record ResponderCandidate(ResponderEntity responder, double distanceMeters) {}
}
