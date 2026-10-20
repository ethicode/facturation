package com.facturation.gateway.outbound.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "appro_domains")
public class ApproDomainEntity {

    @Id
    private String name;

    @Column(nullable = false)
    private int position;
}
