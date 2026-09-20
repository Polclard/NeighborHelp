package com.neighborhelp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:./var/uploads}")
    private String uploadDir;

    private final StorageProperties storageProperties;

    public WebMvcConfig(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Nothing is written to disk under any other provider, so there is
        // nothing to serve from /uploads/**.
        if (storageProperties.resolveProvider() != StorageProvider.LOCAL) {
            return;
        }

        String resourceLocation = Paths.get(uploadDir)
            .toAbsolutePath()
            .normalize()
            .toUri()
            .toString();

        if(!resourceLocation.endsWith("/")) {
            resourceLocation = resourceLocation + "/";
        }

        registry.addResourceHandler("/uploads/**")
            .addResourceLocations(resourceLocation);
    }
}
