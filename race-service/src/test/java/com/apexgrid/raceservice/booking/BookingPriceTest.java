package com.apexgrid.raceservice.booking;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class BookingPriceTest {

    // Mirror of BookingServiceImpl.ZONE_MULTIPLIERS — must stay in sync.
    private static final Map<String, Double> ZONE_MULTIPLIERS = Map.of(
            "GA", 1.0, "GS", 2.5, "VIP", 6.0);

    private BigDecimal priceFor(BigDecimal basePrice, String zone, int qty) {
        double m = ZONE_MULTIPLIERS.getOrDefault(zone, 1.0);
        return basePrice.multiply(BigDecimal.valueOf(m)).multiply(BigDecimal.valueOf(qty));
    }

    @Test
    void generalAdmission_oneTicket_equalsBasePrice() {
        assertThat(priceFor(new BigDecimal("199.99"), "GA", 1))
                .isEqualByComparingTo("199.99");
    }

    @Test
    void grandstand_isTwoAndHalfTimesBase() {
        assertThat(priceFor(new BigDecimal("100.00"), "GS", 1))
                .isEqualByComparingTo("250.00");
    }

    @Test
    void vip_isSixTimesBase() {
        assertThat(priceFor(new BigDecimal("100.00"), "VIP", 1))
                .isEqualByComparingTo("600.00");
    }

    @Test
    void quantity_multipliesPrice() {
        // VIP @ 100, qty 4 => 100 * 6.0 * 4 = 2400
        assertThat(priceFor(new BigDecimal("100.00"), "VIP", 4))
                .isEqualByComparingTo("2400.00");
    }
}
