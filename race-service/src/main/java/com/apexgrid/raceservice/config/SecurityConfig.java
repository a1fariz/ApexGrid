package com.apexgrid.raceservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Swagger UI - public
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**").permitAll()
                // Public: GET races (list, detail, upcoming, circuits)
                .requestMatchers(HttpMethod.GET, "/api/races/**").permitAll()
                // Public: GET circuits
                .requestMatchers(HttpMethod.GET, "/api/circuits/**").permitAll()
                // ADMIN only: POST, PUT, DELETE races
                .requestMatchers(HttpMethod.POST, "/api/races/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/races/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/races/**").hasRole("ADMIN")
                // ADMIN only: POST, PUT, DELETE circuits
                .requestMatchers(HttpMethod.POST, "/api/circuits/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/circuits/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/circuits/**").hasRole("ADMIN")
                // ADMIN only: statistics
                .requestMatchers("/api/statistics/**").hasRole("ADMIN")
                // All booking endpoints require authentication
                .requestMatchers("/api/bookings/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
