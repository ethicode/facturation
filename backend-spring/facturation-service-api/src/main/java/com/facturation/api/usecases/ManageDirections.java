package com.facturation.api.usecases;

import com.facturation.api.model.DirectionDefinition;
import com.facturation.api.model.RequestContext;
import java.util.List;

public interface ManageDirections {

    List<DirectionDefinition> listDirections(RequestContext ctx);

    List<DirectionDefinition> createDirection(DirectionDefinition input, RequestContext ctx);

    List<DirectionDefinition> updateDirection(String directionName, DirectionDefinition input, RequestContext ctx);

    List<DirectionDefinition> deleteDirection(String directionName, RequestContext ctx);
}
