import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../api/report_api.dart';
import '../api/task_api.dart';

/// Holds the session and the API objects, so screens never construct their own client.
class AuthScope extends StatefulWidget {
  const AuthScope({super.key, required this.child});
  final Widget child;

  static AuthController of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_AuthInherited>()!.state;

  @override
  State<AuthScope> createState() => _AuthScopeState();
}

/// What screens are allowed to see: the session plus the API objects.
abstract class AuthController {
  AuthApi get authApi;
  TaskApi get taskApi;
  ReportApi get reportApi;
  String? get email;
  bool get restoring;
  bool get isAuthenticated;
  Future<void> signIn(Future<String> Function() action);
  Future<void> signOut();
}

class _AuthScopeState extends State<AuthScope> implements AuthController {
  late final ApiClient client = ApiClient();
  @override
  late final AuthApi authApi = AuthApi(client);
  @override
  late final TaskApi taskApi = TaskApi(client);
  @override
  late final ReportApi reportApi = ReportApi(client, taskApi);

  @override
  String? email;
  @override
  bool restoring = true;

  @override
  bool get isAuthenticated => email != null;

  @override
  void initState() {
    super.initState();
    // the interceptor lives outside the widget tree, so it reports an unrecoverable 401 here
    client.onSessionExpired = () {
      if (mounted) setState(() => email = null);
    };
    _restore();
  }

  Future<void> _restore() async {
    final token = await client.accessToken;
    if (!mounted) return;
    setState(() {
      email = token == null ? null : 'signed in';
      restoring = false;
    });
  }

  @override
  Future<void> signIn(Future<String> Function() action) async {
    final address = await action();
    if (mounted) setState(() => email = address);
  }

  @override
  Future<void> signOut() async {
    await authApi.logout();
    if (mounted) setState(() => email = null);
  }

  @override
  Widget build(BuildContext context) => _AuthInherited(
        state: this,
        // snapshots, because comparing the mutable state object against itself is always
        // equal and dependents would never rebuild
        email: email,
        restoring: restoring,
        child: widget.child,
      );
}

class _AuthInherited extends InheritedWidget {
  const _AuthInherited({
    required this.state,
    required this.email,
    required this.restoring,
    required super.child,
  });

  final _AuthScopeState state;
  final String? email;
  final bool restoring;

  @override
  bool updateShouldNotify(_AuthInherited oldWidget) =>
      oldWidget.email != email || oldWidget.restoring != restoring;
}
