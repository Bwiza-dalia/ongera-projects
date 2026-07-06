import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../../../routes/app_routes.dart';

class AuthController extends GetxController {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final passwordVisible = false.obs;
  final isLoading = false.obs;

  bool get canLogin =>
      emailController.text.trim().isNotEmpty &&
      passwordController.text.isNotEmpty;

  @override
  void onInit() {
    super.onInit();
    // Lock to portrait for auth screens
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    emailController.addListener(_refresh);
    passwordController.addListener(_refresh);
  }

  @override
  void onClose() {
    emailController.dispose();
    passwordController.dispose();
    super.onClose();
  }

  void _refresh() => update();

  void togglePasswordVisibility() => passwordVisible.toggle();

  Future<void> login() async {
    if (!canLogin) return;
    isLoading.value = true;
    // TODO: replace with real API call
    await Future<void>.delayed(const Duration(milliseconds: 800));
    isLoading.value = false;
    _goToApp();
  }

  void continueWithGoogle() => _goToApp();
  void continueWithApple() => _goToApp();
  void continueWithFacebook() => _goToApp();

  void _goToApp() {
    // Switch back to landscape before entering the main app
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    Get.offAllNamed(Routes.HOME);
  }
}
