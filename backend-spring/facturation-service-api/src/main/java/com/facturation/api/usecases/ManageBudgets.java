package com.facturation.api.usecases;

import com.facturation.api.model.ApproStateResponse;
import com.facturation.api.model.BudgetItemCreateRequest;
import com.facturation.api.model.BudgetItemUpdateRequest;
import com.facturation.api.model.BudgetUpsertRequest;
import com.facturation.api.model.DeleteBudgetResponse;
import com.facturation.api.model.RequestContext;

public interface ManageBudgets {

    ApproStateResponse getApproState(RequestContext ctx);

    ApproStateResponse saveDirectionBudget(BudgetUpsertRequest input, RequestContext ctx);

    ApproStateResponse createBudgetItem(String directionName, BudgetItemCreateRequest input, RequestContext ctx);

    ApproStateResponse updateBudgetItem(String itemId, BudgetItemUpdateRequest input, RequestContext ctx);

    ApproStateResponse deleteBudgetItem(String itemId, RequestContext ctx);

    DeleteBudgetResponse deleteDirectionBudget(String directionName, String actor, RequestContext ctx);
}
