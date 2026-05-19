package com.apexgrid.raceservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RaceServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RaceServiceApplication.class, args);
    }
}
