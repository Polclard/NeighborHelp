package com.neighborhelp.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Attributes of the refresh-token cookie.
 * <p>
 * When the SPA and the API are served from different sites (for example a
 * frontend on Vercel calling an API on another host), the browser only sends
 * the cookie back when it is marked {@code SameSite=None} and {@code Secure},
 * so both have to be configurable per environment.
 */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.auth.refresh-cookie")
public class RefreshCookieProperties {

    /**
     * Send the cookie over HTTPS only. Must be true whenever sameSite is None.
     */
    private boolean secure = false;

    /**
     * One of Strict, Lax or None.
     */
    @NotBlank
    @Pattern(regexp = "(?i)strict|lax|none")
    private String sameSite = "Lax";

}
