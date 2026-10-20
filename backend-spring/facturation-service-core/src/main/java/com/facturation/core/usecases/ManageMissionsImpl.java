package com.facturation.core.usecases;

import com.facturation.api.model.MissionCreateRequest;
import com.facturation.api.model.MissionResponse;
import com.facturation.api.model.MissionStatusRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageMissions;
import com.facturation.core.mapper.CommandMapper;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.MissionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageMissionsImpl implements ManageMissions {

    private final MissionService missionService;

    @Override
    public List<MissionResponse> listMissions(RequestContext ctx) {
        return ResponseMapper.toMissionResponses(missionService.list());
    }

    @Override
    public MissionResponse createMission(MissionCreateRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(missionService.create(CommandMapper.toCommand(input), ctx.email()));
    }

    @Override
    public MissionResponse updateMissionStatus(String missionCode, MissionStatusRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(
                missionService.updateStatus(missionCode, CommandMapper.toCommand(input), ctx.email()));
    }
}
