package com.apexgrid.raceservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final JdbcTemplate jdbcTemplate;

    // B-02 Fix: Shared secret between API Gateway and downstream services.
    // Only requests with this header are trusted to carry X-User-* headers.
    @Value("${internal.secret:}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String headerUserId = request.getHeader("X-User-Id");
            String incomingSecret = request.getHeader("X-Internal-Secret");

            // B-02 Fix: only trust X-User-* headers if:
            // 1. X-User-Id is present, AND
            // 2. The X-Internal-Secret matches our configured shared secret (gateway auth)
            boolean trustedGatewayRequest = StringUtils.hasText(headerUserId)
                    && StringUtils.hasText(internalSecret)
                    && internalSecret.equals(incomingSecret);

            if (trustedGatewayRequest) {
                // Trust the headers injected by API Gateway (validated via shared secret)
                Integer userId = Integer.parseInt(headerUserId);

                // Real-time suspension check: query users table directly.
                // This ensures suspended users are blocked IMMEDIATELY (no 15-min JWT window).
                // When unsuspended, access is restored on the very next request automatically.
                Boolean isActive = jdbcTemplate.queryForObject(
                        "SELECT is_active FROM users WHERE id = ?",
                        Boolean.class, userId);
                if (Boolean.FALSE.equals(isActive)) {
                    log.warn("Blocked request from suspended user id={}", userId);
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Account has been suspended");
                    return;
                }

                String role = request.getHeader("X-User-Role");
                String username = request.getHeader("X-User-Name");
                String fullName = request.getHeader("X-User-FullName");
                String email = request.getHeader("X-User-Email");

                request.setAttribute("userId", userId);
                request.setAttribute("userRole", role);
                request.setAttribute("username", username);
                if (StringUtils.hasText(fullName)) request.setAttribute("fullName", fullName);
                if (StringUtils.hasText(email)) request.setAttribute("userEmail", email);

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + role)
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(username, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } else {
                // Fallback to parsing JWT directly (e.g., bypassing gateway during local dev, or secret not set)
                String jwt = parseJwt(request);

                if (jwt != null && jwtUtils.validateToken(jwt)) {
                    String username = jwtUtils.extractUsername(jwt);
                    String role = jwtUtils.extractRole(jwt);
                    Integer userId = jwtUtils.extractUserId(jwt);

                    // Real-time suspension check for direct JWT path (e.g., local dev without gateway)
                    Boolean isActive = jdbcTemplate.queryForObject(
                            "SELECT is_active FROM users WHERE id = ?",
                            Boolean.class, userId);
                    if (Boolean.FALSE.equals(isActive)) {
                        log.warn("Blocked direct JWT request from suspended user id={}", userId);
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Account has been suspended");
                        return;
                    }

                    request.setAttribute("userId", userId);
                    request.setAttribute("userRole", role);
                    request.setAttribute("username", username);

                    String fullName = jwtUtils.extractFullName(jwt);
                    if (fullName != null) request.setAttribute("fullName", fullName);

                    String email = jwtUtils.extractEmail(jwt);
                    if (email != null) request.setAttribute("userEmail", email);

                    List<SimpleGrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + role)
                    );

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication in Race Service: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private static final String BEARER_PREFIX = "Bearer ";

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith(BEARER_PREFIX)) {
            return headerAuth.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}

