package com.example.budgetbites;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(UserCleanupService.class);

    private final UserRepository userRepository;

    @Value("${cleanup.unverified.enabled:true}")
    private boolean enabled;

    @Value("${cleanup.unverified.ttl-hours:24}")
    private int ttlHours;

    public UserCleanupService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Scheduled(cron = "${cleanup.unverified.cron:0 0 3 * * *}")
    public void cleanupUnverifiedUsers() {
        if (!enabled) return;

        LocalDateTime cutoff = LocalDateTime.now().minusHours(ttlHours);

        List<User> dead = userRepository.findByEmailVerifiedFalseAndVerificationCodeExpiryBefore(cutoff);
        if (dead.isEmpty()) {
            logger.info("[CLEANUP] No unverified users to delete (cutoff={})", cutoff);
            return;
        }

        logger.warn("[CLEANUP] Deleting {} unverified users (cutoff={})", dead.size(), cutoff);
        userRepository.deleteAll(dead);
    }
}
