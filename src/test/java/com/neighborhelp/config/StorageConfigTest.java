package com.neighborhelp.config;

import com.neighborhelp.service.FileStorageService;
import com.neighborhelp.service.impl.CloudinaryFileStorageService;
import com.neighborhelp.service.impl.LocalFileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Wiring tests for the provider switch.
 *
 * <p>These exist because the original implementation used two mutually exclusive
 * {@code @ConditionalOnProperty} components whose conditions were not
 * exhaustive: a provider value matching neither (most easily an environment
 * variable that is set but empty) registered no {@link FileStorageService} at
 * all, and the application failed to start in production. Unit tests that
 * construct the services directly cannot catch that, so the context is built
 * here instead — with no database, so it runs anywhere.
 */
class StorageConfigTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(StorageConfig.class);

    @Test
    void defaultsToLocalWhenProviderIsNotSet() {
        contextRunner.run(context -> assertThat(context)
                .hasSingleBean(FileStorageService.class)
                .getBean(FileStorageService.class)
                .isInstanceOf(LocalFileStorageService.class));
    }

    @Test
    void usesLocalWhenExplicitlySelected() {
        contextRunner
                .withPropertyValues("app.storage.provider=local")
                .run(context -> assertThat(context)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(LocalFileStorageService.class));
    }

    @Test
    void blankProviderFallsBackToLocalRatherThanRegisteringNothing() {
        contextRunner
                .withPropertyValues("app.storage.provider=")
                .run(context -> assertThat(context)
                        .hasSingleBean(FileStorageService.class)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(LocalFileStorageService.class));
    }

    @Test
    void whitespaceProviderFallsBackToLocal() {
        contextRunner
                .withPropertyValues("app.storage.provider=   ")
                .run(context -> assertThat(context)
                        .hasSingleBean(FileStorageService.class)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(LocalFileStorageService.class));
    }

    @Test
    void usesCloudinaryWhenSelectedWithCredentials() {
        contextRunner
                .withPropertyValues(cloudinaryProperties("cloudinary"))
                .run(context -> assertThat(context)
                        .hasSingleBean(FileStorageService.class)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(CloudinaryFileStorageService.class));
    }

    @Test
    void providerMatchingIsCaseInsensitive() {
        contextRunner
                .withPropertyValues(cloudinaryProperties("CloudInary"))
                .run(context -> assertThat(context)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(CloudinaryFileStorageService.class));
    }

    @Test
    void unknownProviderFailsWithAMessageNamingTheValidValues() {
        contextRunner
                .withPropertyValues("app.storage.provider=s3")
                .run(context -> assertThat(context)
                        .hasFailed()
                        .getFailure()
                        .hasStackTraceContaining("Unknown app.storage.provider 's3'")
                        .hasStackTraceContaining("local, cloudinary"));
    }

    @Test
    void cloudinaryWithoutCredentialsNamesTheMissingVariable() {
        contextRunner
                .withPropertyValues("app.storage.provider=cloudinary")
                .run(context -> assertThat(context)
                        .hasFailed()
                        .getFailure()
                        .hasStackTraceContaining("CLOUDINARY_CLOUD_NAME must be set"));
    }

    private String[] cloudinaryProperties(String provider) {
        return new String[]{
                "app.storage.provider=" + provider,
                "app.storage.cloudinary.cloud-name=demo",
                "app.storage.cloudinary.api-key=123456789012345",
                "app.storage.cloudinary.api-secret=secret"
        };
    }
}
