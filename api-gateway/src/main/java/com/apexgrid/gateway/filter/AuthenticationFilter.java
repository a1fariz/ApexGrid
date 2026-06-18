package com.apexgrid.gateway.filter;

import com.apexgrid.gateway.util.JwtUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // B-02 Fix: shared internal secret to authenticate requests from gateway to downstream services
    @Value("${internal.secret:}")
    private String internalSecret;

    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Bypass authentication for public routes (e.g., login, register)
        if (path.startsWith("/api/auth/")) {
            return chain.filter(exchange);
        }

        // Allow public GET requests to races and circuits, and Swagger UI
        if (request.getMethod().matches("GET") && 
           (path.startsWith("/api/races") || path.startsWith("/api/circuits") ||
            path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs"))) {
            return chain.filter(exchange);
        }

        // For other routes, check Authorization header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        if (!jwtUtil.validateToken(token)) {
            return onError(exchange, "Invalid or expired JWT token", HttpStatus.UNAUTHORIZED);
        }

        try {
            Claims claims = jwtUtil.getAllClaimsFromToken(token);
            
            Object userIdObj = claims.get("userId");
            String userId = userIdObj != null ? String.valueOf(userIdObj) : "";
            String role = claims.get("role", String.class);
            String username = claims.getSubject();
            String fullName = claims.get("fullName", String.class);
            String email = claims.get("email", String.class);

            // Mutate the request to add custom headers for downstream services
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", userId)
                    .header("X-User-Role", role != null ? role : "")
                    .header("X-User-Name", username != null ? username : "")
                    .header("X-User-FullName", fullName != null ? fullName : "")
                    .header("X-User-Email", email != null ? email : "")
                    // B-02 Fix: inject internal secret so downstream services can verify gateway origin
                    .header("X-Internal-Secret", internalSecret != null ? internalSecret : "")
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception e) {
            log.error("Failed to extract claims from token: {}", e.getMessage());
            return onError(exchange, "Failed to parse JWT token", HttpStatus.UNAUTHORIZED);
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        log.warn("Authentication failed: {}", err);
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", httpStatus.value(),
                "error", httpStatus.getReasonPhrase(),
                "message", err
        );
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(body);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            return response.setComplete();
        }
    }

    @Override
    public int getOrder() {
        return -1; // Execute early in the filter chain
    }
}
