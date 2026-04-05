package com.neighborhelp.service;

import com.neighborhelp.dto.auth.AuthTokens;
import com.neighborhelp.dto.auth.LoginRequest;
import com.neighborhelp.dto.auth.RegisterRequest;

public interface AuthService {

    AuthTokens register(RegisterRequest request);

    AuthTokens login(LoginRequest request);

    AuthTokens refresh(String refreshToken);

    void logout(String refreshToken);
}
