package com.facturation.core.usecases;

import com.facturation.api.model.ApproStateResponse;
import com.facturation.api.model.BudgetItemCreateRequest;
import com.facturation.api.model.BudgetItemUpdateRequest;
import com.facturation.api.model.BudgetUpsertRequest;
import com.facturation.api.model.DeleteBudgetResponse;
import com.facturation.api.model.RequestContext;
import com.facturation.api.usecases.ManageBudgets;
import com.facturation.core.exception.BusinessException;
import com.facturation.core.mapper.CommandMapper;
import com.facturation.core.mapper.ResponseMapper;
import com.facturation.core.model.command.BudgetItemCommand;
import com.facturation.core.service.ApproService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ManageBudgetsImpl implements ManageBudgets {

    private final ApproService approService;

    @Override
    public ApproStateResponse getApproState(RequestContext ctx) {
        return ResponseMapper.toResponse(approService.getState());
    }

    @Override
    public ApproStateResponse saveDirectionBudget(BudgetUpsertRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.saveBudget(CommandMapper.toCommand(input)));
    }

    @Override
    public ApproStateResponse createBudgetItem(String directionName, BudgetItemCreateRequest input, RequestContext ctx) {
        if (!directionName.equals(input.direction())) {
            throw BusinessException.badRequest("La direction de la ligne ne correspond pas à l'URL.");
        }
        return ResponseMapper.toResponse(approService.createBudgetItem(
                new BudgetItemCommand(input.direction(), input.label(), input.allocated(), ctx.email())));
    }

    @Override
    public ApproStateResponse updateBudgetItem(String itemId, BudgetItemUpdateRequest input, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.updateBudgetItem(itemId,
                new BudgetItemCommand(null, input.label(), input.allocated(), ctx.email())));
    }

    @Override
    public ApproStateResponse deleteBudgetItem(String itemId, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.deleteBudgetItem(itemId, ctx.email()));
    }

    @Override
    public DeleteBudgetResponse deleteDirectionBudget(String directionName, String actor, RequestContext ctx) {
        return ResponseMapper.toResponse(approService.deleteBudget(directionName, actor));
    }
}
