import 'api_client.dart';

class AuthApi {
  AuthApi(this._client);
  final ApiClient _client;

  Future<String> register(String email, String password) =>
      _authenticate('/api/auth/register', email, password);

  Future<String> login(String email, String password) =>
      _authenticate('/api/auth/login', email, password);

  Future<String> _authenticate(String path, String email, String password) async {
    final json = await _client.request('POST', path,
        body: {'email': email, 'password': password}) as Map<String, dynamic>;
    await _client.saveSession(
      access: json['token'] as String,
      refresh: json['refreshToken'] as String?,
    );
    return json['email'] as String;
  }

  Future<void> logout() async {
    try {
      await _client.request('POST', '/api/auth/logout');
    } finally {
      await _client.clearSession();
    }
  }
}
