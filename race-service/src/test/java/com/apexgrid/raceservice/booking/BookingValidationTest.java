package com.apexgrid.raceservice.booking;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class BookingValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() { factory.close(); }

    private Set<ConstraintViolation<BookingRequest>> violations(BookingRequest req) {
        return validator.validate(req);
    }

    @Test
    void validRequest_passes() {
        BookingRequest req = new BookingRequest();
        req.setRaceId(1);
        req.setQuantity(5);
        req.setZone("VIP");
        assertThat(violations(req)).isEmpty();
    }

    @Test
    void nullRaceId_rejected() {
        BookingRequest req = new BookingRequest();
        req.setRaceId(null);
        req.setQuantity(1);
        assertThat(violations(req).stream().map(v -> v.getPropertyPath().toString()))
                .contains("raceId");
    }

    @Test
    void quantityZero_rejected() {
        BookingRequest req = new BookingRequest();
        req.setRaceId(1);
        req.setQuantity(0);
        assertThat(violations(req).stream().map(v -> v.getPropertyPath().toString()))
                .contains("quantity");
    }

    @Test
    void quantityEleven_rejected() {
        BookingRequest req = new BookingRequest();
        req.setRaceId(1);
        req.setQuantity(11);
        assertThat(violations(req).stream().map(v -> v.getPropertyPath().toString()))
                .contains("quantity");
    }

    @Test
    void invalidZone_rejected() {
        BookingRequest req = new BookingRequest();
        req.setRaceId(1);
        req.setQuantity(1);
        req.setZone("ROYALTY"); // not GA/GS/VIP
        assertThat(violations(req).stream().map(v -> v.getPropertyPath().toString()))
                .contains("zone");
    }

    @Test
    void nullZone_defaultsToGA_andPasses() {
        BookingRequest req = new BookingRequest();
        req.setRaceId(1);
        req.setQuantity(1);
        // zone default in DTO is "GA" — null is never sent because of the default
        assertThat(req.getZone()).isEqualTo("GA");
        assertThat(violations(req)).isEmpty();
    }
}
