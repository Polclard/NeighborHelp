package com.neighborhelp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /**
     * Bound as a String rather than the enum so that a blank value — an env var
     * that exists but was never filled in — is treated as "not chosen" instead
     * of leaving the application with no storage implementation at all.
     */
    private String provider = "";

    private final CloudinaryProperties cloudinary = new CloudinaryProperties();

    public StorageProvider resolveProvider() {
        String value = provider == null ? "" : provider.trim();

        if (value.isEmpty()) {
            // No explicit choice. Supplying the Cloudinary credentials is itself
            // the signal to use it, so a deploy that has them does not silently
            // fall back to disk just because a separate flag was missed.
            return cloudinary.isConfigured() ? StorageProvider.CLOUDINARY : StorageProvider.LOCAL;
        }

        try {
            return StorageProvider.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "Unknown app.storage.provider '%s'. Expected one of: %s".formatted(value, supportedProviders()),
                    exception);
        }
    }

    private static String supportedProviders() {
        return Arrays.stream(StorageProvider.values())
                .map(provider -> provider.name().toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(", "));
    }
}
