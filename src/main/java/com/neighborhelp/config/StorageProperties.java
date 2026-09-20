package com.neighborhelp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /**
     * A provider name is a short word. Anything else is a value that landed in
     * the wrong variable, and echoing it back could put a credential in the logs
     * — which is exactly what a misdirected {@code CLOUDINARY_URL} does.
     */
    private static final Pattern SAFE_TO_ECHO = Pattern.compile("^[A-Za-z0-9_.-]{1,32}$");

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
            // A malformed URL is a deploy that meant to use Cloudinary. Falling
            // back to local disk here would "work" and then drop every upload on
            // the next redeploy, so fail with the shape the value should have.
            if (cloudinary.hasUnparsableUrl()) {
                throw new IllegalStateException(
                        "CLOUDINARY_URL is set but is not a Cloudinary URL. Expected "
                                + "cloudinary://<api_key>:<api_secret>@<cloud_name>, or set CLOUDINARY_CLOUD_NAME / "
                                + "CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET instead.");
            }

            // No explicit choice. Supplying the Cloudinary credentials is itself
            // the signal to use it, so a deploy that has them does not silently
            // fall back to disk just because a separate flag was missed.
            return cloudinary.isConfigured() ? StorageProvider.CLOUDINARY : StorageProvider.LOCAL;
        }

        try {
            return StorageProvider.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(describeUnknownProvider(value), exception);
        }
    }

    private static String describeUnknownProvider(String value) {
        if (CloudinaryProperties.looksLikeCloudinaryUrl(value)) {
            // The Cloudinary dashboard hands out one ready-to-paste line; pasted
            // into the wrong box it becomes the provider name. Say so, because
            // "expected one of: local, cloudinary" does not lead anywhere.
            return ("APP_STORAGE_PROVIDER holds a Cloudinary URL. That value belongs in CLOUDINARY_URL: "
                    + "set CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> and leave "
                    + "APP_STORAGE_PROVIDER unset (or set it to one of: %s). Treat the pasted credential as "
                    + "exposed and rotate the API secret in the Cloudinary console.").formatted(supportedProviders());
        }

        return ("Unknown app.storage.provider %s (environment variable APP_STORAGE_PROVIDER). Expected one of: %s")
                .formatted(echo(value), supportedProviders());
    }

    private static String echo(String value) {
        return SAFE_TO_ECHO.matcher(value).matches()
                ? "'%s'".formatted(value)
                : "<redacted, %d characters>".formatted(value.length());
    }

    private static String supportedProviders() {
        return Arrays.stream(StorageProvider.values())
                .map(provider -> provider.name().toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(", "));
    }
}
