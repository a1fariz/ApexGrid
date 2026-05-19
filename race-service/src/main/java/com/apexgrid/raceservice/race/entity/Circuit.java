package com.apexgrid.raceservice.race.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "circuits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Circuit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "location", nullable = false, length = 100)
    private String location;

    @Column(name = "country", nullable = false, length = 100)
    private String country;

    @Column(name = "length_km", precision = 6, scale = 3)
    private BigDecimal lengthKm;

    @Column(name = "number_of_laps")
    private Integer numberOfLaps;

    @Column(name = "lap_record", length = 50)
    private String lapRecord;

    @Column(name = "lap_record_holder", length = 100)
    private String lapRecordHolder;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Race> races;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
