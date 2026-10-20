package com.facturation.api;

import com.facturation.api.model.MissionCreateRequest;
import com.facturation.api.model.MissionResponse;
import com.facturation.api.model.MissionStatusRequest;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageMissions;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;

@RequestMapping(produces = "application/json")
public interface MissionAPI extends ManageMissions {

    @GetMapping("/api/missions")
    @Override
    List<MissionResponse> listMissions(RequestContext ctx);

    @PostMapping("/api/missions")
    @ResponseStatus(HttpStatus.CREATED)
    @Override
    MissionResponse createMission(@Valid @RequestBody MissionCreateRequest input, RequestContext ctx);

    @PatchMapping("/api/missions/{missionCode}/status")
    @Override
    MissionResponse updateMissionStatus(@PathVariable("missionCode") String missionCode,
                                        @Valid @RequestBody MissionStatusRequest input, RequestContext ctx);
}
