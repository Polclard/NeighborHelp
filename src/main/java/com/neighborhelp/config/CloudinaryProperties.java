package com.neighborhelp.config;

import lombok.Getter;
import lombok.Setter;

/**
 * Bound under {@code app.storage.cloudinary}. Deliberately not validated with
 * bean validation: the values are only required when the Cloudinary provider is
 * selected, and {@link StorageConfig} reports a missing one with a message that
 * names the environment variable to set.
 */
@Getter
@Setter
public class CloudinaryProperties {

    private String cloudName;

    private String apiKey;

    private String apiSecret;

    /**
     * Prefix for every generated public id, so the assets stay grouped inside the
     * Cloudinary media library and several environments can share one account.
     */
    private String folder = "neighborhelp";

}
