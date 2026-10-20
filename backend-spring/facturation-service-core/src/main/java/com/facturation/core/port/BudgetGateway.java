package com.facturation.core.port;

import com.facturation.core.model.BudgetDirection;
import com.facturation.core.model.BudgetItem;
import java.util.List;
import java.util.Optional;

public interface BudgetGateway {

    List<BudgetDirection> findAllBudgets();

    Optional<BudgetDirection> findBudget(String direction);

    boolean existsBudgetForDirectionIgnoreCase(String direction);

    BudgetDirection saveBudget(BudgetDirection budget);

    /** Supprime l'allocation et ses lignes budgétaires. */
    void deleteBudget(String direction);

    List<BudgetItem> findAllItems();

    Optional<BudgetItem> findItem(String id);

    List<BudgetItem> findItemsByDirection(String direction);

    BudgetItem saveItem(BudgetItem item);

    void deleteItem(String id);
}
