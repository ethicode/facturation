package com.facturation.core.gateway;

import com.facturation.core.model.AppState;

public interface AppStateGateway {
    AppState read();

    void write(AppState state);
}
