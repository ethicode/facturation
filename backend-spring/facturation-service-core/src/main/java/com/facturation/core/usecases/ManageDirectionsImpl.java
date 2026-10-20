package com.facturation.core.usecases;

import com.facturation.api.model.DirectionDefinition;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageDirections;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.service.DirectionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageDirectionsImpl implements ManageDirections {

    private final DirectionService directionService;

    @Override
    public List<DirectionDefinition> listDirections(RequestContext ctx) {
        return ResponseMapper.toDirectionDefinitions(directionService.list());
    }

    @Override
    public List<DirectionDefinition> createDirection(DirectionDefinition input, RequestContext ctx) {
        return ResponseMapper.toDirectionDefinitions(directionService.create(input.name()));
    }

    @Override
    public List<DirectionDefinition> updateDirection(String directionName, DirectionDefinition input,
                                                     RequestContext ctx) {
        return ResponseMapper.toDirectionDefinitions(directionService.update(directionName, input.name()));
    }

    @Override
    public List<DirectionDefinition> deleteDirection(String directionName, RequestContext ctx) {
        return ResponseMapper.toDirectionDefinitions(directionService.delete(directionName));
    }
}
