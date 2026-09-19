import 'package:flutter/material.dart';

import 'auth/auth_scope.dart';
import 'features/auth/auth_screen.dart';
import 'features/tasks/task_list_screen.dart';
import 'theme/app_theme.dart';

void main() => runApp(const TasklineApp());

class TasklineApp extends StatelessWidget {
  const TasklineApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      child: MaterialApp(
        title: 'Taskline',
        debugShowCheckedModeBanner: false,
        theme: lightTheme,
        darkTheme: darkTheme,
        // follows the device setting, like the web app's "system" default
        themeMode: ThemeMode.system,
        home: const _Root(),
      ),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final auth = AuthScope.of(context);
    if (auth.restoring) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return auth.isAuthenticated ? const TaskListScreen() : const AuthScreen();
  }
}
