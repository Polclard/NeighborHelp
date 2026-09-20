package com.neighborhelp.config;

import lombok.Getter;
import lombok.Setter;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bound under {@code app.storage.cloudinary}. Deliberately not validated with
 * bean validation: the values are only required when the Cloudinary provider is
 * selected, and {@link StorageConfig} reports a missing one with a message that
 * names the environment variable to set.
 */
@Getter
@Setter
public class CloudinaryProperties {

    /**
     * {@code cloudinary://<api_key>:<api_secret>@<cloud_name>}, optionally
     * followed by query parameters. The Cloudinary dashboard offers this single
     * value ahead of the discrete three, so accept it and split it ourselves
     * rather than making people take the URL apart by hand.
     */
    private static final Pattern CLOUDINARY_URL = Pattern.compile(
            "^cloudinary://(?<apiKey>[^:@/]+):(?<apiSecret>[^@/]+)@(?<cloudName>[^/?#]+).*$");

    /**
     * The dashboard presents the URL as a ready-to-paste environment variable
     * assignment, so the name and the surrounding quotes travel with it more
     * often than not. Strip them instead of failing on a value that is right.
     */
    private static final Pattern ASSIGNMENT_PREFIX = Pattern.compile("^\\s*(?:export\\s+)?CLOUDINARY_URL\\s*=\\s*");

    private String cloudName;

    private String apiKey;

    private String apiSecret;

    /** Set instead of the three above: one URL carrying all of them. */
    private String url;

    /**
     * Prefix for every generated public id, so the assets stay grouped inside the
     * Cloudinary media library and several environments can share one account.
     */
    private String folder = "neighborhelp";

    public String getCloudName() {
        return isSet(cloudName) ? cloudName : fromUrl("cloudName");
    }

    public String getApiKey() {
        return isSet(apiKey) ? apiKey : fromUrl("apiKey");
    }

    public String getApiSecret() {
        return isSet(apiSecret) ? apiSecret : fromUrl("apiSecret");
    }

    /** True when all three credentials are present, i.e. Cloudinary is usable. */
    public boolean isConfigured() {
        return isSet(getCloudName()) && isSet(getApiKey()) && isSet(getApiSecret());
    }

    /**
     * True when {@code app.storage.cloudinary.url} holds something that is not a
     * usable Cloudinary URL. Reported as a configuration error rather than
     * silently falling back to local disk, which would lose every upload.
     */
    public boolean hasUnparsableUrl() {
        return isSet(url) && !matchUrl().matches();
    }

    /**
     * Recognises a value that belongs in {@code CLOUDINARY_URL}, so a credential
     * pasted into the wrong variable can be reported for what it is.
     */
    static boolean looksLikeCloudinaryUrl(String value) {
        return value != null && normalise(value).toLowerCase(Locale.ROOT).startsWith("cloudinary://");
    }

    private String fromUrl(String group) {
        if (!isSet(url)) {
            return null;
        }

        Matcher matcher = matchUrl();
        return matcher.matches() ? matcher.group(group) : null;
    }

    private Matcher matchUrl() {
        return CLOUDINARY_URL.matcher(normalise(url));
    }

    private static String normalise(String value) {
        String trimmed = ASSIGNMENT_PREFIX.matcher(value.trim()).replaceFirst("").trim();

        if (trimmed.length() >= 2
                && (trimmed.startsWith("\"") && trimmed.endsWith("\"")
                || trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.substring(1, trimmed.length() - 1).trim();
        }

        return trimmed;
    }

    private static boolean isSet(String value) {
        return value != null && !value.isBlank();
    }
}
