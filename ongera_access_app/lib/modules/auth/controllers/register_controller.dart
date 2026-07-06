import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../../../routes/app_routes.dart';

class RegisterController extends GetxController {
  final pageController = PageController();
  final currentStep = 0.obs;

  // Step 1 – Personal info
  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final dobText = ''.obs;
  DateTime? selectedDob;

  // Step 2 – Account
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final passwordVisible = false.obs;
  final isLoading = false.obs;

  // Step 3 – Doctor
  final selectedDoctorId = 'ai_doctor'.obs;

  // Step 4 – Caregiver
  final caregiverNameController = TextEditingController();
  final caregiverRelationController = TextEditingController();
  final caregiverPhoneController = TextEditingController();

  bool get canProceedStep1 =>
      firstNameController.text.trim().isNotEmpty &&
      lastNameController.text.trim().isNotEmpty &&
      selectedDob != null;

  bool get canProceedStep2 =>
      emailController.text.trim().isNotEmpty &&
      passwordController.text.length >= 6;

  @override
  void onInit() {
    super.onInit();
    firstNameController.addListener(_refresh);
    lastNameController.addListener(_refresh);
    emailController.addListener(_refresh);
    passwordController.addListener(_refresh);
  }

  @override
  void onClose() {
    pageController.dispose();
    firstNameController.dispose();
    lastNameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    caregiverNameController.dispose();
    caregiverRelationController.dispose();
    caregiverPhoneController.dispose();
    super.onClose();
  }

  void _refresh() => update();

  void _animateTo(int page) {
    currentStep.value = page;
    pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void nextPage() => _animateTo(currentStep.value + 1);

  void previousPage() {
    if (currentStep.value > 0) _animateTo(currentStep.value - 1);
  }

  Future<void> pickDob(BuildContext context) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 30),
      firstDate: DateTime(1900),
      lastDate: now,
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: Theme.of(ctx).colorScheme.copyWith(
                primary: const Color(0xFF2CDAA9),
                onPrimary: const Color(0xFF19233C),
              ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      selectedDob = picked;
      dobText.value =
          '${picked.day.toString().padLeft(2, '0')} / '
          '${picked.month.toString().padLeft(2, '0')} / '
          '${picked.year}';
      _refresh();
    }
  }

  Future<void> register() async {
    if (!canProceedStep2) return;
    isLoading.value = true;
    // TODO: replace with real API call
    await Future<void>.delayed(const Duration(milliseconds: 900));
    isLoading.value = false;
    nextPage();
  }

  void complete() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    Get.offAllNamed(Routes.HOME);
  }

  void togglePasswordVisibility() => passwordVisible.toggle();
}
