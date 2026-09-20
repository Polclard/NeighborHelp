package com.neighborhelp.config;

import com.cloudinary.Cloudinary;
import com.neighborhelp.service.FileStorageService;
import com.neighborhelp.service.impl.CloudinaryFileStorageService;
import com.neighborhelp.service.impl.LocalFileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Chooses the single {@link FileStorageService} implementation.
 *
 * <p>Deliberately a factory method rather than two {@code @ConditionalOnProperty}
 * components: those conditions were not exhaustive, so a provider value that
 * matched neither — a blank environment variable, a typo — registered no bean at
 * all and the application failed to start with an unhelpful message. A switch
 * over the resolved enum always yields exactly one implementation, or a failure
 * that says what is wrong.
 */
@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfig {

    @Bean
    public FileStorageService fileStorageService(
            StorageProperties properties,
            @Value("${app.upload.dir:./var/uploads}") String uploadDir
    ) {
        return switch (properties.resolveProvider()) {
            case LOCAL -> new LocalFileStorageService(uploadDir);
            case CLOUDINARY -> new CloudinaryFileStorageService(
                    cloudinary(properties.getCloudinary()),
                    properties.getCloudinary()
            );
        };
    }

    private Cloudinary cloudinary(CloudinaryProperties properties) {
        Cloudinary cloudinary = new Cloudinary(Map.of(
                "cloud_name", required(properties.getCloudName(), "CLOUDINARY_CLOUD_NAME"),
                "api_key", required(properties.getApiKey(), "CLOUDINARY_API_KEY"),
                "api_secret", required(properties.getApiSecret(), "CLOUDINARY_API_SECRET")
        ));

        // The SPA is served over HTTPS, so http:// delivery URLs would be blocked
        // as mixed content. Set explicitly rather than relying on the map key.
        cloudinary.config.secure = true;
        return cloudinary;
    }

    private String required(String value, String environmentVariable) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "%s must be set when app.storage.provider=cloudinary".formatted(environmentVariable));
        }

        return value;
    }
}
