package com.sentinelx.location.grpc;

import com.sentinelx.location.entity.CampusZoneEntity;
import com.sentinelx.location.service.LocationService;
import com.sentinelx.proto.location.*;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LocationGrpcService extends LocationServiceGrpc.LocationServiceImplBase {

    private final LocationService locationService;

    public LocationGrpcService(LocationService locationService) {
        this.locationService = locationService;
    }

    @Override
    public void getDistance(DistanceRequest request, StreamObserver<DistanceResponse> responseObserver) {
        double dist = locationService.calculateHaversineDistanceMeters(
                request.getOrigin().getLatitude(),
                request.getOrigin().getLongitude(),
                request.getDestination().getLatitude(),
                request.getDestination().getLongitude()
        );
        double travelSeconds = locationService.estimateTravelSeconds(dist);

        DistanceResponse response = DistanceResponse.newBuilder()
                .setDistanceMeters(dist)
                .setEstimatedTravelSeconds(travelSeconds)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    public void findNearestResponders(NearestRespondersRequest request, StreamObserver<NearestRespondersResponse> responseObserver) {
        List<LocationService.ResponderCandidate> candidates = locationService.findNearestAvailableResponders(
                request.getIncidentLocation().getLatitude(),
                request.getIncidentLocation().getLongitude(),
                request.getMaxResults(),
                request.getMaxRadiusMeters(),
                request.getRequiredSkillsList()
        );

        NearestRespondersResponse.Builder builder = NearestRespondersResponse.newBuilder();

        for (LocationService.ResponderCandidate c : candidates) {
            ResponderLocationInfo info = ResponderLocationInfo.newBuilder()
                    .setResponderId(c.responder().getId())
                    .setResponderName(c.responder().getName())
                    .setCurrentLocation(GeoPoint.newBuilder()
                            .setLatitude(c.responder().getLatitude())
                            .setLongitude(c.responder().getLongitude())
                            .build())
                    .setDistanceMeters(c.distanceMeters())
                    .addAllSkills(List.of(c.responder().getSkills().split(",")))
                    .setActiveIncidentCount(c.responder().getActiveIncidents())
                    .build();
            builder.addResponders(info);
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void checkZone(ZoneCheckRequest request, StreamObserver<ZoneCheckResponse> responseObserver) {
        Optional<CampusZoneEntity> zoneOpt = locationService.findZoneForCoordinates(
                request.getLocation().getLatitude(),
                request.getLocation().getLongitude()
        );

        ZoneCheckResponse.Builder builder = ZoneCheckResponse.newBuilder();
        if (zoneOpt.isPresent()) {
            CampusZoneEntity z = zoneOpt.get();
            builder.setZoneId(z.getId())
                    .setZoneName(z.getName())
                    .setIsRestricted(z.isRestricted());
        } else {
            builder.setZoneId("UNKNOWN")
                    .setZoneName("Out of Zone")
                    .setIsRestricted(false);
        }

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }
}
