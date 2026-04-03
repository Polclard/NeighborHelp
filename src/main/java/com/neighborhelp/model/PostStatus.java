package com.neighborhelp.model;

public enum PostStatus {
    REQUESTING, // When user is requesting for help
    SERVICE_ACCEPTED, // User that sees the request for help accepts to help
    SERVICE_DONE, // The request is done and so the service is done
    CANCELLED, // For X reason the requesting user can cancel the request
    OFFERING, // User that offers certain services will use this status
    UNAVAILABLE, // If User that offers services is currently unavailable
    CLOSED // If User that offers services is currently closed
}
