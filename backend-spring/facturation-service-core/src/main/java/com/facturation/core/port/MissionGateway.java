package com.facturation.core.port;

import com.facturation.core.model.Mission;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MissionGateway {

    List<Mission> findAll();

    Optional<Mission> findByCode(String code);

    List<String> findAllCodes();

    boolean existsByCodeIgnoreCase(String code);

    Mission save(Mission mission);

    BigDecimal sumConsumedByBudgetItem(String budgetItemId);

    boolean existsByBudgetItemIdIn(Collection<String> budgetItemIds);
}
