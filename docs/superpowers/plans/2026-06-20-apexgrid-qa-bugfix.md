# ApexGrid QA & Bugfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real, executable test suite (unit + Testcontainers integration + `@WebMvcTest` + Docker-Compose E2E smoke) for ApexGrid, prove or disprove the five suspected BLOCKER/MAJOR bugs, fix each confirmed bug with a failing→passing test, and produce an honest sign-off report from actual run output.

**Architecture:** Four test layers. Layer 1 = pure unit tests of logic. Layer 2 = `@SpringBootTest` against a Testcontainers PostgreSQL (real triggers, `CHECK` constraints, pessimistic locks) — this is where oversell/idempotency/state-machine/quota tests live, with concurrency driven by `ExecutorService` + `CountDownLatch`. Layer 3 = `@WebMvcTest` for controller-level RBAC/owner checks with mocked services. Layer 4 = Docker-Compose E2E smoke (tagged, runs last). Bugfixes are surgical; refresh-token rotation and the DB oversell guard are the two real behavioral changes.

**Tech Stack:** Java 17, Spring Boot 3.2.5, JUnit 5 (via spring-boot-starter-test), Testcontainers PostgreSQL 1.19.x, Mockito (via spring-boot-starter-test), Maven.

**Reference spec:** `docs/superpowers/specs/2026-06-20-apexgrid-qa-bugfix-design.md`

**Working-tree note:** Three `race-service` files are currently modified in the working tree (`BookingController.java`, `BookingRepository.java`, `BookingServiceImpl.java`). Those modifications are the **baseline** for this plan — do not revert them. Tasks below build on top of that baseline.

---

## File Structure (created / modified)

### New test sources
- `race-service/src/test/java/com/apexgrid/raceservice/support/RaceServiceTestConfiguration.java` — shared Testcontainers + test `application.properties` wiring (reuse one Postgres container across the module's IT classes).
- `race-service/src/test/java/com/apexgrid/raceservice/support/TestDataFactory.java` — builders for Race/Booking/User rows.
- `race-service/src/test/java/com/apexgrid/raceservice/support/ConcurrentRunner.java` — `ExecutorService`+`CountDownLatch` harness with result capture.
- `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingLifecycleIT.java` — Layer 2: create/confirm/cancel/scan, state machine, quota engine (D1, D2, D3).
- `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingConcurrencyIT.java` — Layer 2: oversell, double-confirm, double-cancel (D1, D2).
- `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingControllerSecurityTest.java` — Layer 3: RBAC + owner checks with mocked service (D4).
- `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingValidationTest.java` — Layer 1: BookingRequest validation (smoke).
- `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingPriceTest.java` — Layer 1: zone multiplier / price calc (smoke).
- `race-service/src/test/resources/application-test.properties` — Testcontainers datasource + test jwt/internal.secret.
- `race-service/src/test/resources/schema-test.sql` — copy of `database/schema.sql` used to init the container (added in Task 0).

### Modified production sources
- `race-service/.../booking/service/impl/BookingServiceImpl.java` — confirm idempotency (Task 6).
- `database/schema.sql` + `race-service/src/test/resources/schema-test.sql` — defensive guard in `update_race_quota()` (Task 7).
- `race-service/.../exception/GlobalExceptionHandler.java` — map trigger-raised oversell exception to 409 (Task 7).
- `user-service/.../service/impl/AuthServiceImpl.java` — refresh-token rotation (Task 10).

### New user-service test sources
- `user-service/src/test/java/com/apexgrid/userservice/auth/RefreshTokenRotationIT.java` — Layer 2: rotation + anti-replay (D5).
- `user-service/src/test/java/com/apexgrid/userservice/auth/AuthServiceIT.java` — Layer 2: register/login/verify/logout smoke (smoke).
- `user-service/src/test/resources/application-test.properties` + `schema-test.sql`.

### E2E (Layer 4, deferred to last task; tagged)
- `race-service/src/test/java/com/apexgrid/raceservice/e2e/FullStackE2E.java` — `@Tag("e2e")`.

### Report
- `docs/qa/2026-06-20-qa-report.md` — filled from real run output in the final task.

---

## Task 0: Establish a clean compile + Docker baseline

**Files:**
- Read only (no changes): root `pom.xml`, all module `pom.xml`.

- [ ] **Step 1: Confirm Docker daemon is running**

Run: `docker info --format "{{.ServerVersion}}"`
Expected: a version string (e.g. `29.5.3`). If this errors, STOP and report — Testcontainers cannot run; fall back to "tests written, not executed" and inform the user.

- [ ] **Step 2: Confirm a clean compile of all modules (skip tests)**

Run: `mvn -q -DskipTests clean package`
Expected: BUILD SUCCESS for `api-gateway`, `user-service`, `race-service` (aggregator last). If a module fails to compile, STOP — that is a pre-existing BLOCKER unrelated to tests; report it before proceeding.

- [ ] **Step 3: Record baseline working-tree state**

Run: `git status --short`
Expected (baseline): the three already-modified `race-service` files plus the two new `docs/superpowers/...` files from the spec/plan commits. Do NOT `git add` anything here.

- [ ] **Step 4: No commit** (verification-only step).

---

## Task 1: Add test dependencies to race-service

**Files:**
- Modify: `race-service/pom.xml` (insert before closing `</dependencies>` at line 88).

- [ ] **Step 1: Add spring-boot-starter-test, testcontainers postgresql, and testcontainers junit-jupiter**

Insert this block immediately before the `</dependencies>` line in `race-service/pom.xml`:

```xml
        <!-- Test scope -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <version>1.19.7</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>1.19.7</version>
            <scope>test</scope>
        </dependency>
```

- [ ] **Step 2: Verify dependencies resolve**

Run: `mvn -q -pl race-service dependency:resolve -DincludeScope=test`
Expected: BUILD SUCCESS, no "Could not resolve" errors.

- [ ] **Step 3: Commit**

```bash
git add race-service/pom.xml
git commit -m "test(race-service): add starter-test, spring-security-test, testcontainers"
```

---

## Task 2: Test support scaffolding for race-service (Testcontainers + factory + concurrency harness)

**Files:**
- Create: `race-service/src/test/resources/application-test.properties`
- Create: `race-service/src/test/resources/schema-test.sql`
- Create: `race-service/src/test/java/com/apexgrid/raceservice/support/RaceServiceITBase.java`
- Create: `race-service/src/test/java/com/apexgrid/raceservice/support/TestDataFactory.java`
- Create: `race-service/src/test/java/com/apexgrid/raceservice/support/ConcurrentRunner.java`

- [ ] **Step 1: Create `application-test.properties`**

Create `race-service/src/test/resources/application-test.properties`:

```properties
# Integration test profile — datasource overridden by Testcontainers @DynamicPropertySource
spring.jpa.hibernate.ddl-auto=none
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.sql.init.mode=never
spring.jpa.defer-datasource-initialization=false

# Required by JwtUtils.init() and JwtAuthenticationFilter (test fallback path)
jwt.secret=test-secret-key-that-is-at-least-thirty-two-bytes-long-xx
jwt.expiration=3600000
internal.secret=test-internal-secret

# Disable real mail sending during tests
spring.mail.host=localhost
spring.mail.port=3025

# Faster scheduler is NOT enabled — we test the scheduler logic directly, not via cron
```

- [ ] **Step 2: Create `schema-test.sql` as a verbatim copy of `database/schema.sql`**

Run (Windows cmd):
```cmd
copy "database\schema.sql" "race-service\src\test\resources\schema-test.sql"
```
Then open the new file and confirm it contains the `update_race_quota()` function and the `CHECK (available_quota >= 0 AND available_quota <= total_quota)` constraint. (This file will be modified in Task 7; for now it is a faithful copy.)

- [ ] **Step 3: Create the Testcontainers base class**

Create `race-service/src/test/java/com/apexgrid/raceservice/support/RaceServiceITBase.java`:

```java
package com.apexgrid.raceservice.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for race-service integration tests. Boots the full application context
 * against a single shared PostgreSQL container initialized with schema-test.sql,
 * so that triggers (trg_update_quota, trg_set_expiry) and CHECK constraints behave
 * exactly as in production.
 */
@SpringBootTest
@ActiveProfiles("test")
public abstract class RaceServiceITBase {

    @Container
    @ServiceConnection
    public static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("apexgrid_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);

    @DynamicPropertySource
    static void initSchema(DynamicPropertyRegistry registry) {
        // Run the full schema (tables + triggers + sample circuits/races) at startup.
        // Postgres JDBC accepts multiple init scripts via a single combined script.
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.sql.init.mode", () -> "always");
        registry.add("spring.sql.init.schema-locations", () -> "classpath:schema-test.sql");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
    }
}
```

- [ ] **Step 4: Create `TestDataFactory`**

Create `race-service/src/test/java/com/apexgrid/raceservice/support/TestDataFactory.java`:

```java
package com.apexgrid.raceservice.support;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.race.entity.Circuit;
import com.apexgrid.raceservice.race.entity.Race;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Deterministic builders for integration tests. Keeps tests DRY and readable.
 */
public final class TestDataFactory {

    private TestDataFactory() {}

    public static Circuit circuit(String name) {
        Circuit c = new Circuit();
        c.setName(name);
        c.setLocation("Test City");
        c.setCountry("Testland");
        c.setLengthKms(new BigDecimal("5.000"));
        c.setNumberOfLaps(58);
        c.setDescription("test circuit");
        return c;
    }

    /** Race in the future, UPCOMING, with the given total=available quota. */
    public static Race upcomingRace(Circuit circuit, int quota, BigDecimal price) {
        Race r = new Race();
        r.setName("Test GP " + System.nanoTime());
        r.setCircuit(circuit);
        r.setRaceDate(LocalDateTime.now().plusDays(30));
        r.setRaceTime(r.getRaceDate().toLocalTime());
        r.setSeason(2026);
        r.setRound(99);
        r.setTotalQuota(quota);
        r.setAvailableQuota(quota);
        r.setTicketPrice(price);
        r.setCurrency("USD");
        r.setStatus("UPCOMING");
        return r;
    }

    public static BookingRequest bookingRequest(Integer raceId, int qty, String zone) {
        BookingRequest req = new BookingRequest();
        req.setRaceId(raceId);
        req.setQuantity(qty);
        req.setZone(zone);
        return req;
    }
}
```

- [ ] **Step 5: Create `ConcurrentRunner`**

Create `race-service/src/test/java/com/apexgrid/raceservice/support/ConcurrentRunner.java`:

```java
package com.apexgrid.raceservice.support;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Runs a supplier N times in parallel, releasing all threads at once via a
 * shared CountDownLatch. Captures results and thrown exceptions per slot so
 * tests can assert exact counts of successes/failures.
 */
public final class ConcurrentRunner {

    public static final class Outcome<T> {
        public final int index;
        public final T value;
        public final Throwable error;
        public Outcome(int index, T value, Throwable error) {
            this.index = index; this.value = value; this.error = error;
        }
        public boolean succeeded() { return error == null; }
    }

    private ConcurrentRunner() {}

    public static <T> List<Outcome<T>> run(int threads, int perThread, Supplier<T> task) throws InterruptedException {
        int total = threads * perThread;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(total);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(total);
        List<Outcome<T>> outcomes = new ArrayList<>(total);
        for (int i = 0; i < total; i++) outcomes.add(null);

        for (int i = 0; i < total; i++) {
            final int idx = i;
            pool.submit(() -> {
                ready.countDown();
                try {
                    start.await();
                    T result = task.get();
                    outcomes.set(idx, new Outcome<>(idx, result, null));
                } catch (Throwable t) {
                    outcomes.set(idx, new Outcome<>(idx, null, t));
                } finally {
                    done.countDown();
                }
            });
        }
        ready.await();
        start.countDown();
        boolean finished = done.await(60, TimeUnit.SECONDS);
        pool.shutdownNow();
        if (!finished) {
            throw new IllegalStateException("Concurrent run did not complete within 60s");
        }
        return outcomes;
    }

    public static <T> long countSuccess(List<Outcome<T>> outcomes) {
        return outcomes.stream().filter(Outcome::succeeded).count();
    }

    public static <T> long countFailure(List<Outcome<T>> outcomes) {
        return outcomes.stream().filter(o -> !o.succeeded()).count();
    }
}
```

- [ ] **Step 6: Verify scaffolding compiles**

Run: `mvn -q -pl race-service test-compile`
Expected: BUILD SUCCESS (no test classes are run yet — none are annotated to run at this stage).

- [ ] **Step 7: Commit**

```bash
git add race-service/src/test/
git commit -m "test(race-service): add Testcontainers base, data factory, concurrency harness"
```

---

## Task 3: Layer 1 unit tests — BookingRequest validation & price calc

These are the cheapest proof points. They validate the `@Valid` constraints and the zone multiplier math in `BookingServiceImpl` without Spring.

**Files:**
- Create: `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingValidationTest.java`
- Create: `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingPriceTest.java`

- [ ] **Step 1: Write the validation test**

Create `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingValidationTest.java`:

```java
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
```

- [ ] **Step 2: Run validation tests — verify they pass**

Run: `mvn -q -pl race-service test -Dtest=BookingValidationTest`
Expected: BUILD SUCCESS, 6 tests pass.

- [ ] **Step 3: Write the price calculation test**

The price logic lives inline in `BookingServiceImpl.createBooking`. To test it deterministically without Spring, we extract and assert the exact formula the service uses (mirroring `ZONE_MULTIPLIERS`). This guards against silent price-regression bugs.

Create `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingPriceTest.java`:

```java
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
```

- [ ] **Step 4: Run price tests — verify they pass**

Run: `mvn -q -pl race-service test -Dtest=BookingPriceTest`
Expected: BUILD SUCCESS, 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add race-service/src/test/java/com/apexgrid/raceservice/booking/BookingValidationTest.java race-service/src/test/java/com/apexgrid/raceservice/booking/BookingPriceTest.java
git commit -m "test(race-service): add Layer 1 unit tests for booking validation and pricing"
```

---

## Task 4: Layer 2 integration — booking lifecycle, quota engine, state machine (D1, D2, D3 happy + sad paths)

This is the heart of the QA pass. It exercises the real trigger and constraints.

**Files:**
- Create: `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingLifecycleIT.java`

- [ ] **Step 1: Write the lifecycle test class**

Create `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingLifecycleIT.java`:

```java
package com.apexgrid.raceservice.booking;

import com.apexgrid.raceservice.booking.dto.BookingRequest;
import com.apexgrid.raceservice.booking.dto.BookingResponse;
import com.apexgrid.raceservice.booking.entity.Booking;
import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.booking.service.BookingService;
import com.apexgrid.raceservice.exception.ApiException;
import com.apexgrid.raceservice.race.entity.Circuit;
import com.apexgrid.raceservice.race.entity.Race;
import com.apexgrid.raceservice.race.repository.CircuitRepository;
import com.apexgrid.raceservice.race.repository.RaceRepository;
import com.apexgrid.raceservice.support.RaceServiceITBase;
import com.apexgrid.raceservice.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingLifecycleIT extends RaceServiceITBase {

    @Autowired private BookingService bookingService;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private RaceRepository raceRepository;
    @Autowired private CircuitRepository circuitRepository;

    private Race smallRace;       // quota=2
    private static final Integer USER_A = 1001;
    private static final Integer USER_B = 1002;
    private static final String EMAIL_A = "a@test.com";
    private static final String EMAIL_B = "b@test.com";

    @BeforeEach
    void setUp() {
        // Clean slate for deterministic quota assertions.
        bookingRepository.deleteAllInBatch();
        // Reset smallRace quota each time by deleting + recreating the race row.
        raceRepository.deleteAllInBatch();
        circuitRepository.deleteAllInBatch();

        Circuit c = circuitRepository.save(TestDataFactory.circuit("Lifecycle Circuit"));
        smallRace = raceRepository.save(TestDataFactory.upcomingRace(c, 2, new BigDecimal("100.00")));
    }

    private BookingResponse create(Integer userId, String email, int qty, String zone) {
        BookingRequest req = TestDataFactory.bookingRequest(smallRace.getId(), qty, zone);
        return bookingService.createBooking(req, userId, email, "user" + userId, "User " + userId);
    }

    @Test
    @DisplayName("create: PENDING, expired_at = created + 30min, quota UNCHANGED")
    void createBooking_isPendingAndDoesNotDecrementQuota() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");

        assertThat(r.getStatus()).isEqualTo("PENDING");
        assertThat(r.getExpiredAt()).isNotNull();
        // expired_at set by trigger = created_at + 30 min
        assertThat(r.getExpiredAt()).isEqualTo(r.getCreatedAt().plusMinutes(30));

        Race fresh = raceRepository.findById(smallRace.getId()).orElseThrow();
        assertThat(fresh.getAvailableQuota()).isEqualTo(2); // unchanged
    }

    @Test
    @DisplayName("confirm: PENDING->CONFIRMED decrements quota by quantity")
    void confirm_decrementsQuota() {
        BookingResponse r = create(USER_A, EMAIL_A, 2, "GA");
        bookingService.confirmBooking(r.getId(), USER_A);

        Race fresh = raceRepository.findById(smallRace.getId()).orElseThrow();
        assertThat(fresh.getAvailableQuota()).isEqualTo(0);
    }

    @Test
    @DisplayName("cancel from CONFIRMED: restores quota")
    void cancelConfirmed_restoresQuota() {
        BookingResponse r = create(USER_A, EMAIL_A, 2, "GA");
        bookingService.confirmBooking(r.getId(), USER_A);
        assertThat(raceRepository.findById(smallRace.getId()).orElseThrow().getAvailableQuota()).isEqualTo(0);

        bookingService.cancelBooking(r.getId(), "changed mind", USER_A, EMAIL_A);

        assertThat(raceRepository.findById(smallRace.getId()).orElseThrow().getAvailableQuota()).isEqualTo(2);
    }

    @Test
    @DisplayName("cancel from PENDING (manual): quota UNCHANGED")
    void cancelPending_leavesQuotaUnchanged() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        bookingService.cancelBooking(r.getId(), "nope", USER_A, EMAIL_A);

        assertThat(raceRepository.findById(smallRace.getId()).orElseThrow().getAvailableQuota()).isEqualTo(2);
    }

    @Test
    @DisplayName("state machine: confirm a CANCELLED booking -> rejected")
    void confirmAfterCancel_rejected() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        bookingService.cancelBooking(r.getId(), "x", USER_A, EMAIL_A);

        assertThatThrownBy(() -> bookingService.confirmBooking(r.getId(), USER_A))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("state machine: scan CONFIRMED -> USED")
    void scan_confirmedToUsed() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        bookingService.confirmBooking(r.getId(), USER_A);
        BookingResponse scanned = bookingService.scanBooking(r.getBookingCode());

        assertThat(scanned.getStatus()).isEqualTo("USED");
        assertThat(scanned.getScannedAt()).isNotNull();
    }

    @Test
    @DisplayName("state machine: re-scan USED -> rejected (idempotent reject)")
    void rescanUsed_rejected() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        bookingService.confirmBooking(r.getId(), USER_A);
        bookingService.scanBooking(r.getBookingCode());

        assertThatThrownBy(() -> bookingService.scanBooking(r.getBookingCode()))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("state machine: scan PENDING -> rejected")
    void scanPending_rejected() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        assertThatThrownBy(() -> bookingService.scanBooking(r.getBookingCode()))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("state machine: cancel a USED ticket -> rejected")
    void cancelUsed_rejected() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        bookingService.confirmBooking(r.getId(), USER_A);
        bookingService.scanBooking(r.getBookingCode());

        assertThatThrownBy(() -> bookingService.cancelBooking(r.getId(), "x", USER_A, EMAIL_A))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("authz: USER B cannot confirm USER A's booking -> 403")
    void crossUserConfirm_forbidden() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        assertThatThrownBy(() -> bookingService.confirmBooking(r.getId(), USER_B))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("authz: USER B cannot cancel USER A's booking -> 403")
    void crossUserCancel_forbidden() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        assertThatThrownBy(() -> bookingService.cancelBooking(r.getId(), "x", USER_B, EMAIL_B))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("double-booking: same user, same race, two active bookings -> 409")
    void doubleBookingSameUser_rejected() {
        create(USER_A, EMAIL_A, 1, "GA");
        assertThatThrownBy(() -> create(USER_A, EMAIL_A, 1, "GA"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    @DisplayName("insufficient quota: create with qty > available -> 400")
    void createMoreThanAvailable_rejected() {
        assertThatThrownBy(() -> create(USER_A, EMAIL_A, 5, "GA")) // quota is 2
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("confirm when remaining quota insufficient -> 400 (no oversell)")
    void confirmInsufficientQuota_rejected() {
        // USER A confirms 2 (uses all quota)
        BookingResponse a = create(USER_A, EMAIL_A, 2, "GA");
        bookingService.confirmBooking(a.getId(), USER_A);

        // USER B has a PENDING booking of 1 created earlier? No — double-booking is per-user.
        // Create a second user's PENDING booking BEFORE A confirms, then try to confirm after.
        // To stage this: temporarily raise quota is not allowed; instead create B first.
        // (Re-set scenario within constraints:)
        bookingRepository.deleteAllInBatch();
        // Two pending bookings exist now only if we recreate — but smallRace quota is 0.
        // Demonstrate the confirm-time check directly: new pending then confirm should fail.
        // Reset race quota by re-saving a fresh race with quota 1 and two pending bookings:
        Race fresh = raceRepository.findById(smallRace.getId()).orElseThrow();
        fresh.setAvailableQuota(1);
        fresh.setTotalQuota(1);
        raceRepository.save(fresh);
        raceRepository.flush();

        BookingResponse b1 = create(USER_A, EMAIL_A, 1, "GA");  // pending, ok
        BookingResponse b2 = create(USER_B, EMAIL_B, 1, "GA");  // pending, ok (no decrement yet)
        // Confirm first -> quota 1 -> 0
        bookingService.confirmBooking(b1.getId(), USER_A);
        // Confirm second -> must be rejected (quota 0 < 1), no oversell
        assertThatThrownBy(() -> bookingService.confirmBooking(b2.getId(), USER_B))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        assertThat(raceRepository.findById(smallRace.getId()).orElseThrow().getAvailableQuota())
                .as("quota must never go negative").isEqualTo(0);
    }
}
```

- [ ] **Step 2: Run the lifecycle IT — verify pass/fail per test**

Run: `mvn -pl race-service test -Dtest=BookingLifecycleIT`
Expected: Most pass against the current code. **`cancelUsed_rejected` may already pass** (service checks `scannedAt`). **`confirmInsufficientQuota_rejected` is the oversell proof** — it should pass today because of the pessimistic lock + pre-check; record the actual result. Capture full output for the report.

If any test fails due to a *real* bug (not a test bug), do NOT modify the test to make it pass — record it and create a fix task.

- [ ] **Step 3: Commit (tests as-is, regardless of pass/fail)**

```bash
git add race-service/src/test/java/com/apexgrid/raceservice/booking/BookingLifecycleIT.java
git commit -m "test(race-service): add Layer 2 lifecycle IT covering quota engine + state machine + authz"
```

---

## Task 5: Layer 2 integration — concurrency (oversell + double-confirm + double-cancel)

**Files:**
- Create: `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingConcurrencyIT.java`

- [ ] **Step 1: Write the concurrency test class**

Create `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingConcurrencyIT.java`:

```java
package com.apexgrid.raceservice.booking;

import com.apexgrid.raceservice.booking.dto.BookingResponse;
import com.apexgrid.raceservice.booking.repository.BookingRepository;
import com.apexgrid.raceservice.booking.service.BookingService;
import com.apexgrid.raceservice.race.entity.Circuit;
import com.apexgrid.raceservice.race.entity.Race;
import com.apexgrid.raceservice.race.repository.CircuitRepository;
import com.apexgrid.raceservice.race.repository.RaceRepository;
import com.apexgrid.raceservice.support.ConcurrentRunner;
import com.apexgrid.raceservice.support.RaceServiceITBase;
import com.apexgrid.raceservice.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class BookingConcurrencyIT extends RaceServiceITBase {

    @Autowired private BookingService bookingService;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private RaceRepository raceRepository;
    @Autowired private CircuitRepository circuitRepository;

    private Race race;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAllInBatch();
        raceRepository.deleteAllInBatch();
        circuitRepository.deleteAllInBatch();
        Circuit c = circuitRepository.save(TestDataFactory.circuit("Concurrency Circuit"));
        race = raceRepository.save(TestDataFactory.upcomingRace(c, 5, new BigDecimal("100.00")));
    }

    @Test
    @DisplayName("OVERSELL: 20 distinct users each create+confirm 1 ticket on quota=5 — exactly 5 succeed, quota never < 0")
    void oversell_noNegativeQuota() throws Exception {
        final int raceId = race.getId();
        final int total = 20;
        // Each "user" is a unique id so the double-booking guard does not interfere.
        AtomicInteger userIdSeq = new AtomicInteger(2000);

        // Phase 1: all create PENDING first (no quota change). Unique users avoid double-booking.
        Map<Integer, Integer> userToBookingId = new ConcurrentHashMap<>();
        List<ConcurrentRunner.Outcome<BookingResponse>> creates = ConcurrentRunner.run(
                total, 1, () -> {
                    int uid = userIdSeq.getAndIncrement();
                    BookingResponse r = bookingService.createBooking(
                            TestDataFactory.bookingRequest(raceId, 1, "GA"),
                            uid, "u" + uid + "@t.com", "u" + uid, "U" + uid);
                    userToBookingId.put(uid, r.getId());
                    return r;
                });
        assertThat(ConcurrentRunner.countSuccess(creates)).isEqualTo(total);

        // Phase 2: all confirm concurrently — only 5 should succeed (quota=5).
        List<ConcurrentRunner.Outcome<BookingResponse>> confirms = ConcurrentRunner.run(
                total, 1, () -> {
                    // Pick any user/booking for this slot
                    Map.Entry<Integer, Integer> e = userToBookingId.entrySet().iterator().next();
                    return bookingService.confirmBooking(e.getValue(), e.getKey());
                });

        long confirmSuccess = ConcurrentRunner.countSuccess(confirms);
        long confirmFailure = ConcurrentRunner.countFailure(confirms);

        // Exactly `quota` confirmations must succeed.
        assertThat(confirmSuccess)
                .as("exactly quota(5) confirmations should succeed, got " + confirmSuccess)
                .isEqualTo(5);
        assertThat(confirmFailure).isEqualTo(total - 5);

        Race fresh = raceRepository.findById(raceId).orElseThrow();
        assertThat(fresh.getAvailableQuota())
                .as("quota must never go negative").isGreaterThanOrEqualTo(0);
        assertThat(fresh.getAvailableQuota()).isEqualTo(0);
    }

    @Test
    @DisplayName("IDEMPOTENCY-confirm: two concurrent confirms of the SAME booking -> quota decremented ONCE")
    void doubleConfirmSingleBooking_quotaOnce() throws Exception {
        final int raceId = race.getId();
        // Create one booking as a single user
        BookingResponse b = bookingService.createBooking(
                TestDataFactory.bookingRequest(raceId, 1, "GA"),
                3001, "u3001@t.com", "u3001", "U3001");
        final Integer bookingId = b.getId();

        List<ConcurrentRunner.Outcome<BookingResponse>> confirms = ConcurrentRunner.run(
                4, 1, () -> bookingService.confirmBooking(bookingId, 3001));

        long success = ConcurrentRunner.countSuccess(confirms);

        Race fresh = raceRepository.findById(raceId).orElseThrow();
        // Regardless of how many threads "succeeded", quota must drop by exactly 1.
        assertThat(fresh.getAvailableQuota())
                .as("quota must be 4 (started 5, one booking of qty 1)")
                .isEqualTo(4);
        // Record the success/failure split for the report (current contract: 1 ok, 3 error).
        // (Do not hard-assert the split — the idempotency fix in Task 6 may change it to 4 ok.)
        System.out.println("[doubleConfirm] success=" + success);
    }

    @Test
    @DisplayName("IDEMPOTENCY-cancel: two concurrent cancels of the SAME CONFIRMED booking -> quota restored ONCE")
    void doubleCancelSingleBooking_quotaOnce() throws Exception {
        final int raceId = race.getId();
        BookingResponse b = bookingService.createBooking(
                TestDataFactory.bookingRequest(raceId, 2, "GA"),
                3002, "u3002@t.com", "u3002", "U3002");
        bookingService.confirmBooking(b.getId(), 3002);
        // quota is now 5 - 2 = 3
        assertThat(raceRepository.findById(raceId).orElseThrow().getAvailableQuota()).isEqualTo(3);

        List<ConcurrentRunner.Outcome<BookingResponse>> cancels = ConcurrentRunner.run(
                4, 1, () -> bookingService.cancelBooking(b.getId(), "x", 3002, "u3002@t.com"));

        // After cancel, quota must be restored exactly once -> 5 again.
        assertThat(raceRepository.findById(raceId).orElseThrow().getAvailableQuota())
                .as("quota restored exactly once")
                .isEqualTo(5);
        System.out.println("[doubleCancel] success=" + ConcurrentRunner.countSuccess(cancels));
    }
}
```

- [ ] **Step 2: Run the concurrency IT**

Run: `mvn -pl race-service test -Dtest=BookingConcurrencyIT`
Expected: This is the BLOCKER proof. **`oversell_noNegativeQuota` is the key assertion.** Capture: how many of 20 confirms succeeded, final quota. If quota went negative or more than 5 succeeded → BLOCKER confirmed, proceed to Task 7 (the DB guard fix) immediately.

Record the actual numbers for the report. Do not weaken assertions.

- [ ] **Step 3: Commit**

```bash
git add race-service/src/test/java/com/apexgrid/raceservice/booking/BookingConcurrencyIT.java
git commit -m "test(race-service): add concurrency IT — oversell, double-confirm, double-cancel proofs"
```

---

## Task 6: BUGFIX — confirm idempotency (make confirm safe to retry)

**Context:** Currently `confirmBooking` throws when the booking is already CONFIRMED. Under concurrency (Task 5's double-confirm test) this is the *correct* behavior for distinct threads, BUT a client retrying after a network blip should not get a hard error and should never risk a second decrement. The fix: treat confirm-of-already-confirmed as an idempotent no-op returning current state (mirroring `cancelBooking`'s idempotency), while still rejecting confirm of PENDING-→-CONFIRMED transition only once at the DB level via the trigger.

**Files:**
- Modify: `race-service/src/main/java/com/apexgrid/raceservice/booking/service/impl/BookingServiceImpl.java` (lines 144-148)
- Test: `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingLifecycleIT.java` (add a test)

- [ ] **Step 1: Write the failing test first (TDD)**

Add this test to `BookingLifecycleIT.java` (inside the class, after `confirm_decrementsQuota`):

```java
    @Test
    @DisplayName("idempotency: confirming an already-CONFIRMED booking is a safe no-op, no double decrement")
    void confirmTwice_idempotentNoDoubleDecrement() {
        BookingResponse r = create(USER_A, EMAIL_A, 1, "GA");
        bookingService.confirmBooking(r.getId(), USER_A);            // quota 2 -> 1
        BookingResponse second = bookingService.confirmBooking(r.getId(), USER_A); // idempotent

        assertThat(second.getStatus()).isEqualTo("CONFIRMED");
        assertThat(raceRepository.findById(smallRace.getId()).orElseThrow().getAvailableQuota())
                .as("quota decremented exactly once across two confirms")
                .isEqualTo(1);
    }
```

- [ ] **Step 2: Run the test — verify it FAILS**

Run: `mvn -pl race-service test -Dtest=BookingLifecycleIT#confirmTwice_idempotentNoDoubleDecrement`
Expected: FAIL with `ApiException: Only PENDING bookings can be confirmed`. This is the expected red.

- [ ] **Step 3: Implement the fix**

In `BookingServiceImpl.java`, replace this block (currently lines ~145-148):

```java
        if (!"PENDING".equals(booking.getStatus())) {
            throw new ApiException("Only PENDING bookings can be confirmed. Current status: " + booking.getStatus(),
                    HttpStatus.BAD_REQUEST);
        }
```

with:

```java
        // Idempotency: a second confirm of an already-CONFIRMED booking is a safe no-op.
        // The trigger only fires on status CHANGE (WHEN OLD.status IS DISTINCT FROM NEW.status),
        // so re-saving a CONFIRMED booking cannot double-decrement quota. Return current state.
        if ("CONFIRMED".equals(booking.getStatus())) {
            return mapToBookingResponse(booking);
        }

        if (!"PENDING".equals(booking.getStatus())) {
            throw new ApiException("Only PENDING bookings can be confirmed. Current status: " + booking.getStatus(),
                    HttpStatus.BAD_REQUEST);
        }
```

- [ ] **Step 4: Run the test — verify it PASSES**

Run: `mvn -pl race-service test -Dtest=BookingLifecycleIT#confirmTwice_idempotentNoDoubleDecrement`
Expected: PASS. Quota is 1 (decremented once).

- [ ] **Step 5: Run the full lifecycle IT — verify no regression**

Run: `mvn -pl race-service test -Dtest=BookingLifecycleIT`
Expected: all tests pass, including the existing `confirmAfterCancel_rejected` (CANCELLED→CONFIRMED still throws) and the concurrency double-confirm (quota still decremented once).

- [ ] **Step 6: Commit**

```bash
git add race-service/src/main/java/com/apexgrid/raceservice/booking/service/impl/BookingServiceImpl.java race-service/src/test/java/com/apexgrid/raceservice/booking/BookingLifecycleIT.java
git commit -m "fix(race-service): make confirm idempotent — no double quota decrement on retry"
```

---

## Task 7: BUGFIX — DB-level oversell guard (defense-in-depth) + 409 mapping

**Context:** Task 5's oversell test proves whether the Java pre-check + pessimistic lock holds. Regardless of the outcome, add a defensive guard inside `update_race_quota()` so the DB itself rejects oversell, and map that exception to a clean 409. This is cheap insurance and makes the invariant local to the data.

**Files:**
- Modify: `database/schema.sql` (the `update_race_quota()` function, ~lines 283-309)
- Modify: `race-service/src/test/resources/schema-test.sql` (same function — keep in sync)
- Modify: `race-service/src/main/java/com/apexgrid/raceservice/exception/GlobalExceptionHandler.java`
- Test: `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingConcurrencyIT.java` (add a guard test)

- [ ] **Step 1: Write a test that asserts the trigger raises on oversell**

Add to `BookingConcurrencyIT.java` (after `oversell_noNegativeQuota`):

```java
    @Test
    @DisplayName("DB GUARD: direct UPDATE that would make quota negative raises an exception")
    void dbGuard_rejectsOversellAtTriggerLevel() {
        // Quota is 5. We build bookings directly via the repository to bypass the
        // Java-layer pre-check, so this proves the DB trigger itself rejects oversell.

        // 1) Drain available quota to 0 with five qty-1 confirmations.
        for (int i = 0; i < 5; i++) {
            com.apexgrid.raceservice.booking.entity.Booking x =
                    com.apexgrid.raceservice.booking.entity.Booking.builder()
                            .bookingCode("APEX-DRAIN-" + i + "-" + System.nanoTime())
                            .userId(5000 + i)
                            .race(race)
                            .quantity(1)
                            .zone("GA")
                            .totalPrice(new BigDecimal("100.00"))
                            .status("PENDING")
                            .build();
            x = bookingRepository.saveAndFlush(x);
            x.setStatus("CONFIRMED");
            bookingRepository.saveAndFlush(x);
        }
        assertThat(raceRepository.findById(race.getId()).orElseThrow().getAvailableQuota()).isEqualTo(0);

        // 2) Insert a fresh PENDING booking with quantity 6 (more than remaining quota 0),
        //    then attempt to confirm it directly. The trigger MUST raise.
        com.apexgrid.raceservice.booking.entity.Booking oversell =
                com.apexgrid.raceservice.booking.entity.Booking.builder()
                        .bookingCode("APEX-OVERSELL-" + System.nanoTime())
                        .userId(4001)
                        .race(race)
                        .quantity(6)
                        .zone("GA")
                        .totalPrice(new BigDecimal("600.00"))
                        .status("PENDING")
                        .build();
        oversell = bookingRepository.saveAndFlush(oversell);

        oversell.setStatus("CONFIRMED");
        final com.apexgrid.raceservice.booking.entity.Booking toConfirm = oversell;
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> bookingRepository.saveAndFlush(toConfirm))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);

        assertThat(raceRepository.findById(race.getId()).orElseThrow().getAvailableQuota())
                .as("quota stays at 0, never negative").isEqualTo(0);
    }
```

- [ ] **Step 2: Run the test — verify it FAILS**

Run: `mvn -pl race-service test -Dtest=BookingConcurrencyIT#dbGuard_rejectsOversellAtTriggerLevel`
Expected: FAIL — the current trigger has no guard, so the `saveAndFlush(manual)` succeeds and quota goes to -6, OR the existing `CHECK` constraint fires (in which case the test passes for a *different* reason and we still add the explicit guard). Record which.

- [ ] **Step 3: Implement the trigger guard in BOTH schema files**

In `database/schema.sql`, replace the `update_race_quota()` function body (the `IF OLD.status = 'PENDING' AND NEW.status = 'CONFIRMED' THEN` block) so the function becomes:

```sql
CREATE OR REPLACE FUNCTION update_race_quota()
RETURNS TRIGGER AS $$
DECLARE
    available INTEGER;
BEGIN

    -- Reduce quota when booking confirmed — REJECT if insufficient (oversell guard).
    IF OLD.status = 'PENDING'
       AND NEW.status = 'CONFIRMED' THEN

        SELECT available_quota INTO available
        FROM races WHERE id = NEW.race_id;

        IF available < NEW.quantity THEN
            RAISE EXCEPTION 'OVERSELL_PREVENTED: race_id=% available=% requested=%',
                NEW.race_id, available, NEW.quantity
                USING ERRCODE = 'check_violation';
        END IF;

        UPDATE races
        SET available_quota = available_quota - NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    -- Restore quota ONLY if previously confirmed
    IF OLD.status = 'CONFIRMED'
       AND NEW.status = 'CANCELLED' THEN

        UPDATE races
        SET available_quota = available_quota + NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Apply the **identical** change to `race-service/src/test/resources/schema-test.sql`.

- [ ] **Step 4: Map the trigger exception to HTTP 409 in the exception handler**

In `race-service/src/main/java/com/apexgrid/raceservice/exception/GlobalExceptionHandler.java`, add a new handler before `handleDataIntegrityViolation`:

```java
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = "Cannot delete this record because it is currently being used by other data.";
        HttpStatus status = HttpStatus.CONFLICT;

        Throwable root = ex;
        while (root.getCause() != null) root = root.getCause();
        String sqlMsg = root.getMessage();

        if (sqlMsg != null && sqlMsg.contains("OVERSELL_PREVENTED")) {
            return buildErrorResponse(
                    "Booking could not be confirmed: this race is sold out. " + sqlMsg,
                    HttpStatus.CONFLICT);
        }
        if (sqlMsg != null) {
            if (sqlMsg.contains("races_circuit_id_fkey")) {
                message = "Cannot delete this circuit because it is currently used by one or more races.";
            } else if (sqlMsg.contains("bookings_race_id_fkey")) {
                message = "Cannot delete this race because there are bookings associated with it.";
            } else if (sqlMsg.contains("chk_quota")) {
                message = "Operation rejected: would violate race quota constraint.";
            }
        }
        return buildErrorResponse(message, status);
    }
```

(This replaces the existing `handleDataIntegrityViolation` method — same signature, augmented body.)

- [ ] **Step 5: Run the guard test — verify it PASSES**

Run: `mvn -pl race-service test -Dtest=BookingConcurrencyIT#dbGuard_rejectsOversellAtTriggerLevel`
Expected: PASS. Note: because Testcontainers reuses the container, you may need to force a fresh container if the old function is cached. If the test still fails with the old function, add `.withReuse(false)` temporarily to `RaceServiceITBase.POSTGRES` to confirm, then decide whether to keep reuse on.

- [ ] **Step 6: Run the full race-service suite — verify no regression**

Run: `mvn -pl race-service test`
Expected: all tests pass. Pay special attention to `BookingLifecycleIT.confirmInsufficientQuota_rejected` and `BookingConcurrencyIT.oversell_noNegativeQuota` — both must still pass and quota must never go negative.

- [ ] **Step 7: Commit**

```bash
git add database/schema.sql race-service/src/test/resources/schema-test.sql race-service/src/main/java/com/apexgrid/raceservice/exception/GlobalExceptionHandler.java race-service/src/test/java/com/apexgrid/raceservice/booking/BookingConcurrencyIT.java
git commit -m "fix(race-service): DB-level oversell guard in update_race_quota() + 409 mapping"
```

---

## Task 8: Layer 3 — `@WebMvcTest` controller RBAC + owner checks (D4)

Proves `@PreAuthorize` and the controller-side owner check without booting the DB.

**Files:**
- Create: `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingControllerSecurityTest.java`

- [ ] **Step 1: Write the controller security test**

Create `race-service/src/test/java/com/apexgrid/raceservice/booking/BookingControllerSecurityTest.java`:

```java
package com.apexgrid.raceservice.booking;

import com.apexgrid.raceservice.booking.controller.BookingController;
import com.apexgrid.raceservice.booking.dto.BookingResponse;
import com.apexgrid.raceservice.booking.service.BookingService;
import com.apexgrid.raceservice.config.SecurityConfig;
import com.apexgrid.raceservice.exception.ApiException;
import com.apexgrid.raceservice.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookingController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class BookingControllerSecurityTest {

    @Autowired private MockMvc mvc;
    @MockBean private BookingService bookingService;
    @MockBean private com.apexgrid.raceservice.config.JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockBean private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    @WithMockUser(roles = "USER")
    void getUserBookings_requiresAuth_userOk() throws Exception {
        // controller calls extractUserId -> reads "userId" attribute set by filter.
        // With a mocked filter that does nothing, the attribute is null -> 401 from controller.
        // This test documents the dependency on the gateway/filter. We assert 401 here
        // to prove the controller defends itself when identity is missing.
        mvc.perform(get("/api/bookings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void scanEndpoint_user_forbidden() throws Exception {
        mvc.perform(post("/api/bookings/CODE/scan"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void scanEndpoint_admin_allowed() throws Exception {
        BookingResponse stub = BookingResponse.builder().bookingCode("CODE").status("USED").build();
        when(bookingService.scanBooking(eq("CODE"))).thenReturn(stub);
        mvc.perform(post("/api/bookings/CODE/scan"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void adminBookingsList_user_forbidden() throws Exception {
        mvc.perform(get("/api/bookings/admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminBookingsList_admin_allowed() throws Exception {
        when(bookingService.getAllBookings(any(), any(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(org.springframework.data.domain.Page.empty());
        mvc.perform(get("/api/bookings/admin"))
                .andExpect(status().isOk());
    }
}
```

- [ ] **Step 2: Run the controller security test**

Run: `mvn -pl race-service test -Dtest=BookingControllerSecurityTest`
Expected: BUILD SUCCESS, 5 tests pass. (The `getUserBookings_requiresAuth_userOk` test asserts the controller's own defense when the identity attribute is missing — this documents and locks the gateway/filter dependency.)

- [ ] **Step 3: Commit**

```bash
git add race-service/src/test/java/com/apexgrid/raceservice/booking/BookingControllerSecurityTest.java
git commit -m "test(race-service): Layer 3 controller RBAC — USER vs ADMIN on scan/admin endpoints"
```

---

## Task 9: race-service full module verification

- [ ] **Step 1: Run the entire race-service test suite**

Run: `mvn -pl race-service test`
Expected: BUILD SUCCESS, all tests green. Capture the test count and the Surefire summary lines for the report.

- [ ] **Step 2: If any test fails, do not proceed — create a fix task and loop**

Record the failure verbatim. Diagnose (use systematic-debugging if needed). Fix. Re-run until green.

- [ ] **Step 3: No commit** (verification-only; all changes already committed per-task).

---

## Task 10: user-service test deps + refresh-token rotation (D5)

**Context:** `AuthServiceImpl.refreshToken` currently returns the **same** refresh token. The spec requires rotation + anti-replay (old token invalid after refresh).

**Files:**
- Modify: `user-service/pom.xml`
- Create: `user-service/src/test/resources/application-test.properties`
- Create: `user-service/src/test/resources/schema-test.sql`
- Create: `user-service/src/test/java/com/apexgrid/userservice/support/UserServiceITBase.java`
- Create: `user-service/src/test/java/com/apexgrid/userservice/auth/RefreshTokenRotationIT.java`
- Modify: `user-service/src/main/java/com/apexgrid/userservice/service/impl/AuthServiceImpl.java`

- [ ] **Step 1: Add test dependencies to `user-service/pom.xml`**

Insert before `</dependencies>`:

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <version>1.19.7</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>1.19.7</version>
            <scope>test</scope>
        </dependency>
```

- [ ] **Step 2: Create test config + schema**

Create `user-service/src/test/resources/application-test.properties`:

```properties
spring.jpa.hibernate.ddl-auto=none
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema-test.sql
spring.jpa.defer-datasource-initialization=false
jwt.secret=test-secret-key-that-is-at-least-thirty-two-bytes-long-xx
jwt.expiration=3600000
app.jwt.refresh-expiration-ms=604800000
spring.mail.host=localhost
spring.mail.port=3025
```

Copy the schema: `copy "database\schema.sql" "user-service\src\test\resources\schema-test.sql"` (cmd). This includes the `roles`, `users`, `refresh_tokens`, `verification_tokens`, `password_reset_tokens` tables and the admin seed.

- [ ] **Step 3: Create the IT base class**

Create `user-service/src/test/java/com/apexgrid/userservice/support/UserServiceITBase.java`:

```java
package com.apexgrid.userservice.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
@ActiveProfiles("test")
public abstract class UserServiceITBase {

    @Container
    @ServiceConnection
    public static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("apexgrid_user_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
```

- [ ] **Step 4: Write the failing rotation test (TDD)**

Create `user-service/src/test/java/com/apexgrid/userservice/auth/RefreshTokenRotationIT.java`:

```java
package com.apexgrid.userservice.auth;

import com.apexgrid.userservice.dto.*;
import com.apexgrid.userservice.exception.ApiException;
import com.apexgrid.userservice.repository.RefreshTokenRepository;
import com.apexgrid.userservice.repository.UserRepository;
import com.apexgrid.userservice.repository.VerificationTokenRepository;
import com.apexgrid.userservice.service.AuthService;
import com.apexgrid.userservice.support.UserServiceITBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RefreshTokenRotationIT extends UserServiceITBase {

    @Autowired private AuthService authService;
    @Autowired private RefreshTokenRepository refreshRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private VerificationTokenRepository verificationTokenRepo;

    private String username;
    private String refreshToken;

    @BeforeEach
    void setUp() {
        String unique = "fan" + System.nanoTime();
        username = unique;
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername(unique);
        reg.setEmail(unique + "@f1.com");
        reg.setPassword("password123");
        reg.setFullName("Test Fan");
        authService.register(reg);

        // Auto-verify (mirrors e2e-test.js) by flipping the flag directly.
        userRepo.findByUsernameIgnoreCase(unique).ifPresent(u -> {
            u.setIsVerified(true);
            userRepo.save(u);
        });

        LoginRequest login = new LoginRequest();
        login.setUsername(unique);
        login.setPassword("password123");
        JwtResponse jwt = authService.login(login);
        refreshToken = jwt.getRefreshToken();
    }

    @Test
    @DisplayName("refresh: returns a NEW refresh token (rotation)")
    void refresh_returnsNewRefreshToken() {
        TokenRefreshRequest req = new TokenRefreshRequest();
        req.setRefreshToken(refreshToken);
        TokenRefreshResponse res = authService.refreshToken(req);

        assertThat(res.getAccessToken()).isNotBlank();
        assertThat(res.getRefreshToken())
                .as("refresh token must rotate — new value, different from the old")
                .isNotEqualTo(refreshToken);
    }

    @Test
    @DisplayName("anti-replay: old refresh token rejected after a refresh (rotation invalidates it)")
    void oldRefreshToken_rejectedAfterRefresh() {
        TokenRefreshRequest first = new TokenRefreshRequest();
        first.setRefreshToken(refreshToken);
        authService.refreshToken(first); // rotates

        TokenRefreshRequest replay = new TokenRefreshRequest();
        replay.setRefreshToken(refreshToken); // the OLD one
        assertThatThrownBy(() -> authService.refreshToken(replay))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("new refresh token issued by rotation is itself usable")
    void newRefreshToken_isUsable() {
        TokenRefreshRequest first = new TokenRefreshRequest();
        first.setRefreshToken(refreshToken);
        TokenRefreshResponse res = authService.refreshToken(first);

        TokenRefreshRequest second = new TokenRefreshRequest();
        second.setRefreshToken(res.getRefreshToken());
        TokenRefreshResponse res2 = authService.refreshToken(second); // must not throw
        assertThat(res2.getAccessToken()).isNotBlank();
    }
}
```

- [ ] **Step 5: Run the test — verify it FAILS**

Run: `mvn -pl user-service test -Dtest=RefreshTokenRotationIT`
Expected: `refresh_returnsNewRefreshToken` and `oldRefreshToken_rejectedAfterRefresh` FAIL (current code returns the same token). `newRefreshToken_isUsable` may pass. This is the expected red.

- [ ] **Step 6: Implement refresh-token rotation**

In `user-service/src/main/java/com/apexgrid/userservice/service/impl/AuthServiceImpl.java`, replace the `refreshToken` method (currently lines ~272-297) with:

```java
    @Override
    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        com.apexgrid.userservice.entity.RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new ApiException("Refresh token is not in database!", HttpStatus.FORBIDDEN));

        if (refreshToken.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApiException("Refresh token was expired. Please make a new signin request", HttpStatus.FORBIDDEN);
        }

        User user = refreshToken.getUser();

        // Suspend check: if user is suspended, revoke their refresh token immediately
        // and reject the request — no new JWT will be issued.
        if (Boolean.FALSE.equals(user.getIsActive())) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApiException("Your account has been suspended by an administrator", HttpStatus.FORBIDDEN);
        }

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String accessToken = jwtUtils.generateToken(userDetails);

        // ROTATION + ANTI-REPLAY: delete the presented refresh token and issue a brand-new one.
        // The old token becomes invalid immediately, so a stolen-and-replayed token is rejected
        // on the next use. This satisfies the spec's "old refreshToken unusable after refresh".
        refreshTokenRepository.delete(refreshToken);
        refreshTokenRepository.flush();

        String newRefreshTokenStr = UUID.randomUUID().toString();
        com.apexgrid.userservice.entity.RefreshToken newRefreshToken =
                com.apexgrid.userservice.entity.RefreshToken.builder()
                        .user(user)
                        .token(newRefreshTokenStr)
                        .expiryDate(refreshToken.getExpiryDate()) // preserve original 7-day window
                        .build();
        refreshTokenRepository.save(newRefreshToken);

        return new TokenRefreshResponse(accessToken, newRefreshTokenStr);
    }
```

- [ ] **Step 7: Run the rotation test — verify it PASSES**

Run: `mvn -pl user-service test -Dtest=RefreshTokenRotationIT`
Expected: all 3 tests pass.

- [ ] **Step 8: Commit**

```bash
git add user-service/pom.xml user-service/src/test/ user-service/src/main/java/com/apexgrid/userservice/service/impl/AuthServiceImpl.java
git commit -m "fix(user-service): rotate refresh tokens + anti-replay (old token invalid after refresh)"
```

---

## Task 11: user-service auth smoke (register/login/verify/logout)

**Files:**
- Create: `user-service/src/test/java/com/apexgrid/userservice/auth/AuthServiceIT.java`

- [ ] **Step 1: Write the smoke test**

Create `user-service/src/test/java/com/apexgrid/userservice/auth/AuthServiceIT.java`:

```java
package com.apexgrid.userservice.auth;

import com.apexgrid.userservice.dto.*;
import com.apexgrid.userservice.exception.ApiException;
import com.apexgrid.userservice.repository.UserRepository;
import com.apexgrid.userservice.repository.VerificationTokenRepository;
import com.apexgrid.userservice.service.AuthService;
import com.apexgrid.userservice.support.UserServiceITBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthServiceIT extends UserServiceITBase {

    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepo;
    @Autowired private VerificationTokenRepository verificationTokenRepo;

    private RegisterRequest registerRequest(String username) {
        RegisterRequest r = new RegisterRequest();
        r.setUsername(username);
        r.setEmail(username + "@f1.com");
        r.setPassword("password123");
        r.setFullName("Test " + username);
        return r;
    }

    @Test
    void register_persistsUser_asUnverifiedUserRole() {
        String u = "reg" + System.nanoTime();
        authService.register(registerRequest(u));
        userRepo.findByUsernameIgnoreCase(u).ifPresent(user -> {
            assertThat(user.getIsVerified()).isFalse();
            assertThat(user.getRole().getName()).isEqualTo("USER");
            // BCrypt hashes start with $2a$
            assertThat(user.getPassword()).startsWith("$2a$");
        });
    }

    @Test
    void register_duplicateUsername_conflict() {
        String u = "dup" + System.nanoTime();
        authService.register(registerRequest(u));
        assertThatThrownBy(() -> authService.register(registerRequest(u)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void login_unverified_forbidden() {
        String u = "unv" + System.nanoTime();
        authService.register(registerRequest(u)); // not verified
        LoginRequest login = new LoginRequest();
        login.setUsername(u);
        login.setPassword("password123");
        assertThatThrownBy(() -> authService.login(login))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void login_wrongPassword_unauthorized() {
        String u = "wrong" + System.nanoTime();
        authService.register(registerRequest(u));
        userRepo.findByUsernameIgnoreCase(u).ifPresent(usr -> { usr.setIsVerified(true); userRepo.save(usr); });
        LoginRequest login = new LoginRequest();
        login.setUsername(u);
        login.setPassword("wrong-password");
        assertThatThrownBy(() -> authService.login(login))
                .isInstanceOf(org.springframework.security.core.AuthenticationException.class);
    }

    @Test
    void login_afterVerify_returnsTokens() {
        String u = "ok" + System.nanoTime();
        authService.register(registerRequest(u));
        userRepo.findByUsernameIgnoreCase(u).ifPresent(usr -> { usr.setIsVerified(true); userRepo.save(usr); });
        LoginRequest login = new LoginRequest();
        login.setUsername(u);
        login.setPassword("password123");
        JwtResponse jwt = authService.login(login);
        assertThat(jwt.getToken()).isNotBlank();
        assertThat(jwt.getRefreshToken()).isNotBlank();
    }

    @Test
    void logout_invalidatesRefreshToken() {
        String u = "out" + System.nanoTime();
        authService.register(registerRequest(u));
        userRepo.findByUsernameIgnoreCase(u).ifPresent(usr -> { usr.setIsVerified(true); userRepo.save(usr); });
        LoginRequest login = new LoginRequest();
        login.setUsername(u);
        login.setPassword("password123");
        JwtResponse jwt = authService.login(login);

        authService.logout("Bearer " + jwt.getToken());

        TokenRefreshRequest refresh = new TokenRefreshRequest();
        refresh.setRefreshToken(jwt.getRefreshToken());
        assertThatThrownBy(() -> authService.refreshToken(refresh))
                .isInstanceOf(ApiException.class); // token deleted by logout
    }
}
```

- [ ] **Step 2: Run the smoke test**

Run: `mvn -pl user-service test -Dtest=AuthServiceIT`
Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add user-service/src/test/java/com/apexgrid/userservice/auth/AuthServiceIT.java
git commit -m "test(user-service): auth smoke — register/login/verify/logout"
```

---

## Task 12: user-service full module verification

- [ ] **Step 1: Run the entire user-service suite**

Run: `mvn -pl user-service test`
Expected: BUILD SUCCESS. Capture Surefire summary for the report.

- [ ] **Step 2: No commit** (verification-only).

---

## Task 13: Layer 4 — Docker Compose E2E smoke (tagged)

**Context:** This is the "dry run of the live demo." It is the slowest and most environment-fragile layer. It is `@Tag("e2e")` so it can be excluded from fast loops. If the environment cannot sustain a full compose stack, this task documents the manual fallback rather than blocking sign-off.

**Files:**
- Create: `race-service/src/test/java/com/apexgrid/raceservice/e2e/FullStackE2E.java`
- Create: `docs/qa/demo-script.md`

- [ ] **Step 1: Write the E2E test (skipped by default; runs only with `-Dgroups=e2e`)**

Create `race-service/src/test/java/com/apexgrid/raceservice/e2e/FullStackE2E.java`:

```java
package com.apexgrid.raceservice.e2e;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Layer 4 E2E smoke. Requires the full stack running via `docker compose up`.
 * Enabled only when -De2e=true is passed, AND @Tag("e2e") is selected via -Dgroups=e2e.
 * Default `mvn test` does NOT run this — it is opt-in for the demo dry run.
 *
 * Fallback if the environment cannot run the full stack: see docs/qa/demo-script.md
 * for the equivalent manual curl sequence.
 */
@Tag("e2e")
@EnabledIfSystemProperty(named = "e2e", matches = "true")
class FullStackE2E {

    private static final String GATEWAY = System.getProperty("gateway", "http://localhost:8080");

    @Test
    void gateway_isUp() throws Exception {
        HttpClient http = HttpClient.newHttpClient();
        HttpResponse<String> res = http.send(
                HttpRequest.newBuilder(URI.create(GATEWAY + "/api/races?page=0&size=1"))
                        .GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(res.statusCode()).isEqualTo(200);
    }

    @Test
    void adminProtectedRoute_requiresAuth() throws Exception {
        HttpClient http = HttpClient.newHttpClient();
        HttpResponse<String> res = http.send(
                HttpRequest.newBuilder(URI.create(GATEWAY + "/api/bookings/admin"))
                        .GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(res.statusCode()).isEqualTo(401); // no Authorization header
    }
}
```

- [ ] **Step 2: Configure the Surefire plugin to exclude `e2e` by default**

In `race-service/pom.xml`, inside `<build><plugins>`, add (before the `spring-boot-maven-plugin`):

```xml
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <excludedGroups>e2e</excludedGroups>
                </configuration>
            </plugin>
```

- [ ] **Step 3: Write the demo script (manual fallback / actual demo runbook)**

Create `docs/qa/demo-script.md`:

````markdown
# ApexGrid Demo Script (happy path + admin + cancel)

## Prerequisites
```bash
docker compose up --build -d
# wait ~60s for all services to be healthy
```

## 1. Register + verify + login (USER)
```bash
# register
curl -s -X POST localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@apexgrid.com","password":"password123","fullName":"Demo User"}'

# auto-verify in DB (demo only)
docker exec apexgrid-postgres psql -U apex -d apexgrid_db \
  -c "UPDATE users SET is_verified=TRUE WHERE username='demo';"

# login -> copy "token" and "refreshToken"
curl -s -X POST localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"password123"}'
```

## 2. Browse + book + confirm
```bash
TOKEN=<paste token>
# browse
curl -s localhost:8080/api/races?page=0&size=5 | jq '.content[0].id'

# book (replace RACE_ID)
curl -s -X POST localhost:8080/api/bookings \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"raceId":1,"quantity":2,"zone":"GA"}'

# confirm (replace BOOKING_ID) -> status CONFIRMED, e-ticket available
curl -s -X PUT localhost:8080/api/bookings/BOOKING_ID/confirm -H "Authorization: Bearer $TOKEN"
```

## 3. Admin check-in (login as admin / admin123 first)
```bash
ADMIN_TOKEN=<admin token>
# scan -> status USED
curl -s -X POST localhost:8080/api/bookings/BOOKING_CODE/scan -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 4. Cancel + refund
```bash
# create a second booking then cancel it -> status CANCELLED, quota restored
curl -s -X PUT localhost:8080/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"reason":"demo"}'
```

## Expected: zero 5xx, no stack traces, all status transitions as labeled.
````

- [ ] **Step 4: Verify the E2E test is excluded by default and compiles**

Run: `mvn -pl race-service test`
Expected: builds and runs all non-e2e tests; `FullStackE2E` is NOT executed (excluded by tag).

- [ ] **Step 5: Commit**

```bash
git add race-service/src/test/java/com/apexgrid/raceservice/e2e/FullStackE2E.java race-service/pom.xml docs/qa/demo-script.md
git commit -m "test(race-service): add tagged E2E smoke + demo runbook (opt-in via -Dgroups=e2e)"
```

---

## Task 14: Full root build + regression verification

- [ ] **Step 1: Run the entire build at the root, excluding e2e**

Run: `mvn clean verify`
Expected: BUILD SUCCESS for all three modules. Capture the final Surefire/Failsafe summary lines per module for the report (tests run, failures, errors, skipped).

- [ ] **Step 2: If anything fails, STOP and fix**

No proceeding to the report until `mvn verify` is green across all modules.

- [ ] **Step 3: No commit** (verification-only).

---

## Task 15: Write the QA report from real output

**Files:**
- Create: `docs/qa/2026-06-20-qa-report.md`

- [ ] **Step 1: Capture real numbers**

Run: `mvn -pl race-service,user-service test` and copy the Surefire summary lines (e.g. `Tests run: 31, Failures: 0, Errors: 0, Skipped: 0`).

- [ ] **Step 2: Write the report**

Create `docs/qa/2026-06-20-qa-report.md` using this template, **filling every `[...]` from actual run output** — never estimated:

````markdown
# ApexGrid QA Report — 2026-06-20

## Summary
- Modules tested: race-service, user-service
- Total tests: [...]   Pass: [...]   Fail: [...]   Skip: [...]
- BLOCKERs found: [...]   fixed: [...]
- MAJORs found: [...]    fixed: [...]

## Test Results
| ID | Area | Scenario | Expected | Actual | Status | Severity |
|----|------|----------|----------|--------|--------|----------|
| D1-1 | Oversell | 20 concurrent confirms on quota=5 | exactly 5 succeed, quota never <0 | [...] | PASS/FAIL | BLOCKER |
| D1-2 | Oversell | DB guard rejects negative quota | trigger raises | [...] | PASS/FAIL | BLOCKER |
| D2-1 | Idempotency | double-confirm same booking | quota decremented once | [...] | PASS/FAIL | BLOCKER |
| D2-2 | Idempotency | double-cancel same booking | quota restored once | [...] | PASS/FAIL | BLOCKER |
| D3-x | State machine | (per transition) | illegal transitions rejected | [...] | PASS/FAIL | MAJOR |
| D4-x | RBAC | USER→scan/admin 403; cross-user 403 | [...] | [...] | PASS/FAIL | BLOCKER |
| D5-1 | Refresh rotation | new token on refresh | differs from old | [...] | PASS/FAIL | MAJOR |
| D5-2 | Anti-replay | old token rejected after refresh | 403 | [...] | PASS/FAIL | MAJOR |
| ... | ... | ... | ... | ... | ... | ... |

## Bug Reports (per failure found and fixed)
### BUG-1: Refresh token not rotated (MAJOR)
- **Root cause:** `AuthServiceImpl.refreshToken` returned the same refresh token.
- **Patch:** rotation + delete-old + issue-new (commit ...).
- **Test added:** `RefreshTokenRotationIT`.

### BUG-2: Confirm not idempotent (MAJOR)
- **Root cause:** second confirm threw instead of no-op.
- **Patch:** early-return on already-CONFIRMED (commit ...).
- **Test added:** `BookingLifecycleIT#confirmTwice_idempotentNoDoubleDecrement`.

### BUG-3: DB trigger had no oversell guard (BLOCKER, defense-in-depth)
- **Root cause:** `update_race_quota` blindly subtracted.
- **Patch:** guard inside trigger + 409 mapping (commit ...).
- **Test added:** `BookingConcurrencyIT#dbGuard_rejectsOversellAtTriggerLevel`.

## Concurrency evidence
- Oversell test: 20 confirms on quota=5 → [N] succeeded, quota ended at [0]. (paste actual)
- Double-confirm: quota decremented once → [4]. (paste actual)
- Double-cancel: quota restored once → [5]. (paste actual)

## Deferred (flagged, not done this pass)
- Exhaustive OWASP SQLi/XSS fuzzing (JPA parameterization covers SQLi; spot-checked only).
- k6/Gatling load runs (correctness proven via ExecutorService; load tooling is additive).
- Frontend unit tests, visual PDF/QR correctness.

## Sign-off checklist
- [ ] 100% of deep (D1–D5) cases executed
- [ ] All BLOCKER/MAJOR fixed and re-verified
- [ ] Oversell: quota never negative (proven)
- [ ] RBAC fully enforced (no bypass)
- [ ] `mvn verify` green across all modules
- [ ] Demo script (`docs/qa/demo-script.md`) rehearsed: [yes/no]
- [ ] CERTIFIED PRESENTATION-READY: [yes/no, with caveats]
````

- [ ] **Step 3: Commit the report**

```bash
git add docs/qa/2026-06-20-qa-report.md
git commit -m "docs(qa): add QA report from real test output (2026-06-20)"
```

---

## Definition of Done

- `mvn clean verify` is green across `api-gateway`, `user-service`, `race-service`.
- Refresh-token rotation shipped with passing anti-replay test.
- Confirm idempotency shipped with passing double-decrement test.
- DB oversell guard shipped with passing trigger-level test; quota never negative.
- `docs/qa/2026-06-20-qa-report.md` exists with all `[...]` filled from real output.
- `docs/qa/demo-script.md` exists as the rehearsed demo runbook.
- All BLOCKER/MAJOR items in the report marked fixed; any DEFERRED item explicitly listed.

## Rollback

Every fix is its own commit. To revert a single fix:
```
git revert <commit-sha>
```
The schema-test.sql is only used by tests; production `database/schema.sql` change (Task 7) is additive (a guard inside the function) and is safe to revert independently.
