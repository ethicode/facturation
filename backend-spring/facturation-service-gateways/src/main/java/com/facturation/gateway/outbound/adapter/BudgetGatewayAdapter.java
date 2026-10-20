package com.facturation.gateway.outbound.adapter;

import com.facturation.core.model.BudgetDirection;
import com.facturation.core.model.BudgetItem;
import com.facturation.core.port.BudgetGateway;
import com.facturation.gateway.outbound.entity.BudgetDirectionEntity;
import com.facturation.gateway.outbound.entity.BudgetItemEntity;
import com.facturation.gateway.outbound.repository.BudgetDirectionRepository;
import com.facturation.gateway.outbound.repository.BudgetItemRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BudgetGatewayAdapter implements BudgetGateway {

    private final BudgetDirectionRepository budgetRepository;
    private final BudgetItemRepository itemRepository;

    @Override
    public List<BudgetDirection> findAllBudgets() {
        return budgetRepository.findAllByOrderByPositionAsc().stream().map(BudgetGatewayAdapter::toDomain).toList();
    }

    @Override
    public Optional<BudgetDirection> findBudget(String direction) {
        return budgetRepository.findById(direction).map(BudgetGatewayAdapter::toDomain);
    }

    @Override
    public boolean existsBudgetForDirectionIgnoreCase(String direction) {
        return budgetRepository.existsByDirectionIgnoreCase(direction);
    }

    @Override
    public BudgetDirection saveBudget(BudgetDirection budget) {
        BudgetDirectionEntity entity = budgetRepository.findById(budget.getDirection()).orElseGet(() -> {
            BudgetDirectionEntity created = new BudgetDirectionEntity();
            created.setDirection(budget.getDirection());
            created.setPosition(budgetRepository.findMinPosition() - 1);
            return created;
        });
        entity.setAllocated(budget.getAllocated());
        entity.setEngaged(budget.getEngaged());
        entity.setAllocatedBy(budget.getAllocatedBy() == null ? "" : budget.getAllocatedBy());
        return toDomain(budgetRepository.saveAndFlush(entity));
    }

    @Override
    public void deleteBudget(String direction) {
        itemRepository.deleteByDirection(direction);
        budgetRepository.deleteById(direction);
        budgetRepository.flush();
    }

    @Override
    public List<BudgetItem> findAllItems() {
        return itemRepository.findAllByOrderByPositionAsc().stream().map(BudgetGatewayAdapter::toDomain).toList();
    }

    @Override
    public Optional<BudgetItem> findItem(String id) {
        return itemRepository.findById(id).map(BudgetGatewayAdapter::toDomain);
    }

    @Override
    public List<BudgetItem> findItemsByDirection(String direction) {
        return itemRepository.findByDirectionOrderByPositionAsc(direction).stream()
                .map(BudgetGatewayAdapter::toDomain)
                .toList();
    }

    @Override
    public BudgetItem saveItem(BudgetItem item) {
        BudgetItemEntity entity = itemRepository.findById(item.getId()).orElseGet(() -> {
            BudgetItemEntity created = new BudgetItemEntity();
            created.setId(item.getId());
            created.setPosition(itemRepository.findMinPosition() - 1);
            return created;
        });
        entity.setDirection(item.getDirection());
        entity.setLabel(item.getLabel());
        entity.setAllocated(item.getAllocated());
        entity.setCreatedAt(item.getCreatedAt());
        entity.setCreatedBy(item.getCreatedBy() == null ? "" : item.getCreatedBy());
        entity.setUpdatedAt(item.getUpdatedAt());
        entity.setUpdatedBy(item.getUpdatedBy());
        return toDomain(itemRepository.saveAndFlush(entity));
    }

    @Override
    public void deleteItem(String id) {
        itemRepository.deleteById(id);
        itemRepository.flush();
    }

    private static BudgetDirection toDomain(BudgetDirectionEntity entity) {
        return BudgetDirection.builder()
                .direction(entity.getDirection())
                .allocated(entity.getAllocated())
                .engaged(entity.getEngaged())
                .allocatedBy(entity.getAllocatedBy())
                .build();
    }

    private static BudgetItem toDomain(BudgetItemEntity entity) {
        return BudgetItem.builder()
                .id(entity.getId())
                .direction(entity.getDirection())
                .label(entity.getLabel())
                .allocated(entity.getAllocated())
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .build();
    }
}
