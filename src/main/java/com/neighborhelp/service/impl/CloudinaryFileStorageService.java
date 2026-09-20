package com.neighborhelp.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.neighborhelp.config.CloudinaryProperties;
import com.neighborhelp.service.FileStorageService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Stores images in Cloudinary and persists the returned delivery URL.
 *
 * <p>The stored value is the plain (untransformed) secure URL. Per-component
 * resizing is applied by the frontend, which injects a transformation segment
 * into the URL, so a single stored value serves every rendered size.
 */
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "cloudinary")
public class CloudinaryFileStorageService implements FileStorageService {

    private static final String UPLOAD_MARKER = "/image/upload/";

    /** Cloudinary inserts a {@code v<epoch>} segment ahead of the public id. */
    private static final Pattern VERSION_SEGMENT = Pattern.compile("^v\\d+$");

    /**
     * Cloudinary transformation parameter keys. Enumerated rather than matched
     * by shape ({@code [a-z]+_}) so a configured folder such as {@code nh_prod}
     * is never mistaken for a transformation, which would yield a public id that
     * silently fails to delete.
     */
    private static final String TRANSFORMATION_KEY =
            "(?:w|h|c|x|y|z|r|a|b|o|e|f|q|g|d|l|u|t|p|ar|bo|co|cs|dl|dn|dpr|du|eo|fl|fn|ki|pg|so|sp|vc|vs)";

    /** A lone parameter ({@code f_auto}) or a comma-joined set ({@code w_88,h_88,c_fill}). */
    private static final Pattern TRANSFORMATION_SEGMENT = Pattern.compile(
            "^%s_[^/,]*(?:,%s_[^/,]*)*$".formatted(TRANSFORMATION_KEY, TRANSFORMATION_KEY));

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    public CloudinaryFileStorageService(Cloudinary cloudinary, CloudinaryProperties properties) {
        this.cloudinary = cloudinary;
        this.properties = properties;
    }

    @Override
    public String storeProfileAvatar(UUID userId, MultipartFile file) {
        return upload(file, "%s/avatars/%s-%s".formatted(properties.getFolder(), userId, UUID.randomUUID()));
    }

    @Override
    public String storePostPhoto(UUID postId, MultipartFile file) {
        return upload(file, "%s/posts/%s/%s".formatted(properties.getFolder(), postId, UUID.randomUUID()));
    }

    @Override
    public void deleteStoredFile(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return;
        }

        String publicId = extractPublicId(storedPath);

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                    "resource_type", "image",
                    "invalidate", true
            ));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to delete image from Cloudinary", exception);
        }
    }

    private String upload(MultipartFile file, String publicId) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", "image",
                    // The public id already carries a UUID, so let Cloudinary reject
                    // rather than silently clobber if one ever repeats.
                    "overwrite", false,
                    "unique_filename", false,
                    "use_filename", false
            ));

            Object secureUrl = result.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalStateException("Cloudinary upload returned no secure_url");
            }

            return secureUrl.toString();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to upload image to Cloudinary", exception);
        }
    }

    /**
     * Recovers the public id from a stored delivery URL, so deletes need no
     * extra column alongside the existing {@code file_path}/{@code profile_picture} values.
     *
     * <p>We only ever store untransformed URLs, but leading transformation
     * segments are skipped anyway so a hand-edited or legacy value still deletes.
     */
    private String extractPublicId(String storedUrl) {
        int markerIndex = storedUrl.indexOf(UPLOAD_MARKER);
        if (markerIndex < 0) {
            throw new IllegalArgumentException("Stored file path is not a Cloudinary delivery URL");
        }

        String tail = storedUrl.substring(markerIndex + UPLOAD_MARKER.length());
        List<String> segments = List.of(tail.split("/"));

        // Cloudinary always emits a v<epoch> segment immediately before the public
        // id, so when one is present it is an exact delimiter and the folder name
        // cannot be mistaken for a transformation.
        for (int i = 0; i < segments.size(); i++) {
            if (VERSION_SEGMENT.matcher(segments.get(i)).matches()) {
                return requireNonBlank(stripExtension(String.join("/", segments.subList(i + 1, segments.size()))));
            }
        }

        // No version segment: fall back to skipping leading transformations.
        Deque<String> remaining = new ArrayDeque<>(segments);
        while (!remaining.isEmpty() && TRANSFORMATION_SEGMENT.matcher(remaining.peekFirst()).matches()) {
            remaining.removeFirst();
        }

        return requireNonBlank(stripExtension(String.join("/", remaining)));
    }

    private String requireNonBlank(String publicId) {
        if (publicId.isBlank()) {
            throw new IllegalArgumentException("Stored file path is not a Cloudinary delivery URL");
        }

        return publicId;
    }

    private String stripExtension(String publicId) {
        int lastDot = publicId.lastIndexOf('.');
        int lastSlash = publicId.lastIndexOf('/');
        return lastDot > lastSlash ? publicId.substring(0, lastDot) : publicId;
    }
}
