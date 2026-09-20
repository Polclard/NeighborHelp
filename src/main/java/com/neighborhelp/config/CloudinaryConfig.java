package com.neighborhelp.config;

import com.cloudinary.Cloudinary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Only active when {@code app.storage.provider=cloudinary}. Keeping the
 * properties binding here means a local/dev run never has to supply Cloudinary
 * credentials just to satisfy validation.
 */
@Configuration
@EnableConfigurationProperties(CloudinaryProperties.class)
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "cloudinary")
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(CloudinaryProperties properties) {
        Cloudinary cloudinary = new Cloudinary(Map.of(
                "cloud_name", properties.getCloudName(),
                "api_key", properties.getApiKey(),
                "api_secret", properties.getApiSecret()
        ));

        // The SPA is served over HTTPS, so http:// delivery URLs would be blocked
        // as mixed content. Set explicitly rather than relying on the map key.
        cloudinary.config.secure = true;
        return cloudinary;
    }
}
