package com.neighborhelp.config;

import com.neighborhelp.service.FileStorageService;
import com.neighborhelp.service.impl.CloudinaryFileStorageService;
import com.neighborhelp.service.impl.LocalFileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.assertj.AssertableApplicationContext;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.io.PrintWriter;
import java.io.StringWriter;

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
    void credentialsAloneSelectCloudinaryWithoutTheProviderFlag() {
        contextRunner
                .withPropertyValues(cloudinaryProperties(""))
                .run(context -> assertThat(context)
                        .hasSingleBean(FileStorageService.class)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(CloudinaryFileStorageService.class));
    }

    @Test
    void partialCredentialsDoNotSelectCloudinary() {
        contextRunner
                .withPropertyValues("app.storage.cloudinary.cloud-name=demo")
                .run(context -> assertThat(context)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(LocalFileStorageService.class));
    }

    @Test
    void explicitLocalOverridesPresentCredentials() {
        contextRunner
                .withPropertyValues(cloudinaryProperties("local"))
                .run(context -> assertThat(context)
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
    void urlAloneSelectsCloudinary() {
        contextRunner
                .withPropertyValues("app.storage.cloudinary.url=cloudinary://123456789012345:secret@demo")
                .run(context -> assertThat(context)
                        .hasSingleBean(FileStorageService.class)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(CloudinaryFileStorageService.class));
    }

    @Test
    void urlPastedWithItsVariableNameStillSelectsCloudinary() {
        contextRunner
                .withPropertyValues(
                        "app.storage.cloudinary.url=CLOUDINARY_URL=cloudinary://123456789012345:secret@demo")
                .run(context -> assertThat(context)
                        .hasSingleBean(FileStorageService.class)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(CloudinaryFileStorageService.class));
    }

    @Test
    void discreteCredentialsWinOverTheUrl() {
        contextRunner
                .withPropertyValues(
                        "app.storage.cloudinary.url=cloudinary://999999999999999:other@from-url",
                        "app.storage.cloudinary.cloud-name=demo",
                        "app.storage.cloudinary.api-key=123456789012345",
                        "app.storage.cloudinary.api-secret=secret")
                .run(context -> assertThat(context)
                        .getBean(FileStorageService.class)
                        .isInstanceOf(CloudinaryFileStorageService.class));
    }

    @Test
    void unparsableUrlFailsRatherThanFallingBackToLocal() {
        contextRunner
                .withPropertyValues("app.storage.cloudinary.url=https://cloudinary.com/console")
                .run(context -> assertThat(context)
                        .hasFailed()
                        .getFailure()
                        .hasStackTraceContaining("CLOUDINARY_URL is set but is not a Cloudinary URL"));
    }

    @Test
    void aCloudinaryUrlInTheProviderVariableSaysWhereItBelongsWithoutEchoingTheSecret() {
        contextRunner
                .withPropertyValues(
                        "app.storage.provider=CLOUDINARY_URL=cloudinary://123456789012345:sup3r-s3cret@demo")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(stackTraceOf(context))
                            .contains("That value belongs in CLOUDINARY_URL")
                            .doesNotContain("sup3r-s3cret");
                });
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

    @Test
    void anyOtherUnknownProviderLongEnoughToHideASecretIsRedacted() {
        contextRunner
                .withPropertyValues("app.storage.provider=s3://bucket-name/uploads?key=sup3r-s3cret")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(stackTraceOf(context))
                            .contains("<redacted,")
                            .doesNotContain("sup3r-s3cret");
                });
    }

    private String stackTraceOf(AssertableApplicationContext context) {
        StringWriter stackTrace = new StringWriter();
        context.getStartupFailure().printStackTrace(new PrintWriter(stackTrace));
        return stackTrace.toString();
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
