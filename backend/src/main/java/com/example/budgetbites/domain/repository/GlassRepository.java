package com.example.budgetbites.domain.repository;

import com.example.budgetbites.domain.entity.Glass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GlassRepository extends JpaRepository<Glass, Long> {

    Optional<Glass> findByName(String name);

    boolean existsByName(String name);
}
