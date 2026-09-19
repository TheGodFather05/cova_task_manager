import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'config.dart';

class ApiException implements Exception {
  ApiException(this.status, this.message, [this.fieldErrors = const {}]);

  final int status;
  final String message;
  final Map<String, String> fieldErrors;

  @override
  String toString() => message;
}

/// Single HTTP entry point. Mirrors the web client: the access token is attached to every
/// request, and a 401 triggers one silent refresh before the session is given up.
class ApiClient {
  ApiClient({http.Client? inner}) : _http = inner ?? http.Client();

  final http.Client _http;

  /// Tokens live in the platform keychain (Keychain on iOS, EncryptedSharedPreferences on
  /// Android), never in plain preferences. v11 encrypts by default.
  static const _storage = FlutterSecureStorage();
  static const _accessKey = 'tm-access';
  static const _refreshKey = 'tm-refresh';

  void Function()? onSessionExpired;

  /// Concurrent 401s share one refresh. Five parallel rotations would present an
  /// already-used token, which the backend correctly reads as theft.
  Future<bool>? _refreshInFlight;

  /// The keychain can hang or throw on a fresh simulator; a missing token is recoverable,
  /// a stuck splash screen is not.
  Future<String?> _read(String key) async {
    try {
      return await _storage.read(key: key).timeout(const Duration(seconds: 3));
    } catch (_) {
      return null;
    }
  }

  Future<String?> get accessToken => _read(_accessKey);

  Future<void> saveSession({required String access, String? refresh}) async {
    try {
      await _storage.write(key: _accessKey, value: access);
      if (refresh != null) await _storage.write(key: _refreshKey, value: refresh);
    } catch (_) {
      // storage unavailable: the session still works until the app is closed
    }
  }

  Future<void> clearSession() async {
    try {
      await _storage.delete(key: _accessKey);
      await _storage.delete(key: _refreshKey);
    } catch (_) {
      // nothing to clear
    }
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    final cleaned = {...?query}..removeWhere((_, v) => v.isEmpty);
    return Uri.parse('$apiBaseUrl$path').replace(
      queryParameters: cleaned.isEmpty ? null : cleaned,
    );
  }

  Future<http.Response> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
    String? token,
  }) {
    final headers = <String, String>{
      // tells the backend to return the refresh token in the body: this client has no cookie jar
      'X-Client': 'mobile',
      if (body != null) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    final uri = _uri(path, query);
    final encoded = body == null ? null : jsonEncode(body);

    return switch (method) {
      'POST' => _http.post(uri, headers: headers, body: encoded),
      'PUT' => _http.put(uri, headers: headers, body: encoded),
      'DELETE' => _http.delete(uri, headers: headers),
      _ => _http.get(uri, headers: headers),
    };
  }

  Future<bool> _refresh() {
    return _refreshInFlight ??= () async {
      try {
        final stored = await _read(_refreshKey);
        if (stored == null) return false;
        // mobile has no cookie jar, so the refresh token travels in a header
        final response = await _http.post(
          _uri('/api/auth/refresh'),
          headers: {'X-Client': 'mobile', 'X-Refresh-Token': stored},
        );
        if (response.statusCode != 200) return false;
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        await saveSession(
          access: json['token'] as String,
          refresh: json['refreshToken'] as String?,
        );
        return true;
      } catch (_) {
        return false;
      } finally {
        scheduleMicrotask(() => _refreshInFlight = null);
      }
    }();
  }

  Future<dynamic> request(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
  }) async {
    var response = await _send(method, path, body: body, query: query,
        token: await accessToken);

    // a 401 from an auth route is the answer, not an expired session
    final isAuthRoute = path.startsWith('/api/auth/');
    if (response.statusCode == 401 && !isAuthRoute) {
      if (await accessToken != null && await _refresh()) {
        response = await _send(method, path, body: body, query: query,
            token: await accessToken);
      } else {
        await clearSession();
        onSessionExpired?.call();
        throw _toException(response);
      }
    }

    if (response.statusCode >= 400) throw _toException(response);
    if (response.statusCode == 204 || response.body.isEmpty) return null;
    return jsonDecode(response.body);
  }

  ApiException _toException(http.Response response) {
    try {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return ApiException(
        response.statusCode,
        json['message'] as String? ?? 'Request failed',
        ((json['errors'] as Map?) ?? {}).map((k, v) => MapEntry('$k', '$v')),
      );
    } catch (_) {
      return ApiException(response.statusCode, 'Request failed');
    }
  }
}
