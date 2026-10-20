package com.facturation.gateway.inbound;

import com.facturation.api.MissionAPI;
import com.facturation.api.model.MissionCreateRequest;
import com.facturation.api.model.MissionResponse;
import com.facturation.api.model.MissionStatusRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageMissions;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MissionEndpoint implements MissionAPI {

    private final ManageMissions manageMissions;

    @Override
    public List<MissionResponse> listMissions(RequestContext ctx) {
        return manageMissions.listMissions(ctx);
    }

    @Override
    public MissionResponse createMission(MissionCreateRequest input, RequestContext ctx) {
        return manageMissions.createMission(input, ctx);
    }

    @Override
    public MissionResponse updateMissionStatus(String missionCode, MissionStatusRequest input, RequestContext ctx) {
        return manageMissions.updateMissionStatus(missionCode, input, ctx);
    }
}
