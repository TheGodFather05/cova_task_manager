import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../auth/auth_scope.dart';
import '../../theme/tokens.dart';
import '../../widgets/primitives.dart';

/// Login and register share a layout; the kit differs only in copy and the extra field.
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.registering = false});
  final bool registering;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmation = TextEditingController();

  late bool _registering = widget.registering;
  String? _error;
  Map<String, String> _fieldErrors = {};
  bool _pending = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _confirmation.dispose();
    super.dispose();
  }

  bool get _mismatch =>
      _registering && _confirmation.text.isNotEmpty && _confirmation.text != _password.text;

  Future<void> _submit() async {
    if (_mismatch) return;
    setState(() {
      _pending = true;
      _error = null;
      _fieldErrors = {};
    });

    final auth = AuthScope.of(context);
    try {
      await auth.signIn(() => _registering
          ? auth.authApi.register(_email.text.trim(), _password.text)
          : auth.authApi.login(_email.text.trim(), _password.text));
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _fieldErrors = e.fieldErrors;
        _error = switch (e.status) {
          401 => 'Email or password is incorrect.',
          409 => 'That email is already registered.',
          _ => e.message,
        };
      });
    } catch (_) {
      if (mounted) setState(() => _error = 'Network error — check your connection.');
    } finally {
      if (mounted) setState(() => _pending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return Scaffold(
      backgroundColor: c.ground,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(22),
            child: Container(
              padding: const EdgeInsets.all(26),
              decoration: BoxDecoration(
                color: c.raised,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: c.line),
                boxShadow: [
                  BoxShadow(
                    color: c.primaryDeep.withValues(alpha: 0.07),
                    blurRadius: 28,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: c.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('TL',
                        style: TextStyle(
                            fontSize: 17, fontWeight: FontWeight.w700, color: c.onPrimary)),
                  ),
                  const SizedBox(height: 16),
                  Text(_registering ? 'Create your account' : 'Sign in to Taskline',
                      style: TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w600, color: c.ink)),
                  const SizedBox(height: 6),
                  Text(
                    _registering
                        ? 'Sort what matters from what is merely loud.'
                        : "Sign in to see your team's work.",
                    style: TextStyle(fontSize: 14, color: c.muted),
                  ),
                  const SizedBox(height: 20),
                  if (_error != null) ...[
                    TasklineAlert(title: _error!),
                    const SizedBox(height: 16),
                  ],
                  TasklineField(
                    label: 'Email',
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    error: _fieldErrors['email'],
                  ),
                  const SizedBox(height: 16),
                  TasklineField(
                    label: 'Password',
                    controller: _password,
                    obscure: true,
                    maxLength: 72,
                    error: _fieldErrors['password'],
                    onChanged: (_) => setState(() {}),
                  ),
                  if (_registering) ...[
                    const SizedBox(height: 8),
                    _StrengthMeter(password: _password.text),
                    const SizedBox(height: 16),
                    TasklineField(
                      label: 'Confirm password',
                      controller: _confirmation,
                      obscure: true,
                      error: _mismatch ? 'Passwords do not match.' : null,
                      onChanged: (_) => setState(() {}),
                    ),
                  ],
                  const SizedBox(height: 22),
                  TasklineButton(
                    label: _registering ? 'Create account' : 'Sign in',
                    pending: _pending,
                    pendingLabel: _registering ? 'Creating account…' : 'Signing in…',
                    onPressed: _submit,
                  ),
                  const SizedBox(height: 14),
                  Center(
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _registering = !_registering;
                        _error = null;
                        _fieldErrors = {};
                      }),
                      child: Text.rich(
                        TextSpan(
                          style: TextStyle(fontSize: 14, color: c.muted),
                          children: [
                            TextSpan(
                                text: _registering
                                    ? 'Already have an account? '
                                    : 'No account yet? '),
                            TextSpan(
                              text: _registering ? 'Sign in' : 'Create one',
                              style: TextStyle(
                                  color: c.primary, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Advisory only: the API accepts any password of 8-72 characters, so this never blocks.
class _StrengthMeter extends StatelessWidget {
  const _StrengthMeter({required this.password});
  final String password;

  (int, String) _assess() {
    if (password.isEmpty) return (0, '');
    if (password.length < 8) return (1, 'Too short — use at least 8 characters.');

    var score = 1;
    if (password.length >= 12) score++;
    if (RegExp(r'[a-z]').hasMatch(password) && RegExp(r'[A-Z]').hasMatch(password)) score++;
    if (RegExp(r'\d').hasMatch(password)) score++;
    if (RegExp(r'[^\w\s]').hasMatch(password)) score++;

    final capped = score.clamp(1, 4);
    return (capped, switch (capped) {
      1 => 'Weak — mix in letters and digits.',
      2 => 'Fair — add upper case or a digit.',
      3 => 'Strong — add a symbol to max it out.',
      _ => 'Excellent — this one holds up well.',
    });
  }

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();
    final c = context.colors;
    final (score, hint) = _assess();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Container(
                height: 4,
                margin: EdgeInsets.only(right: i < 3 ? 6 : 0),
                decoration: BoxDecoration(
                  color: i < score ? c.primary : c.line,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 6),
        Text(hint, style: TextStyle(fontSize: 12, color: c.muted)),
      ],
    );
  }
}
