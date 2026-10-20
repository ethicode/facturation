package com.facturation.api.usecases;

import com.facturation.api.model.MissionCreateRequest;
import com.facturation.api.model.MissionResponse;
import com.facturation.api.model.MissionStatusRequest;
import com.facturation.api.model.RequestContext;
import java.util.List;

public interface ManageMissions {

    List<MissionResponse> listMissions(RequestContext ctx);

    MissionResponse createMission(MissionCreateRequest input, RequestContext ctx);

    MissionResponse updateMissionStatus(String missionCode, MissionStatusRequest input, RequestContext ctx);
}
