package com.neighborhelp.config;

public enum StorageProvider {

    /** Writes to {@code app.upload.dir} and serves the files from {@code /uploads/**}. */
    LOCAL,

    /** Uploads to Cloudinary and stores the returned delivery URL. */
    CLOUDINARY
}
