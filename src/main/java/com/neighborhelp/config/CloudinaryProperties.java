package com.neighborhelp.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.storage.cloudinary")
public class CloudinaryProperties {

    @NotBlank
    private String cloudName;

    @NotBlank
    private String apiKey;

    @NotBlank
    private String apiSecret;

    /**
     * Prefix for every generated public id, so the assets stay grouped inside the
     * Cloudinary media library and several environments can share one account.
     */
    @NotBlank
    private String folder = "neighborhelp";

}
