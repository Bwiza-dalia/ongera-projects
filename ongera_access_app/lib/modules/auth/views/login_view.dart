import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../controllers/auth_controller.dart';
import '../widgets/auth_widgets.dart';
import '../widgets/locale_switcher.dart';

class LoginView extends GetView<AuthController> {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cloudGray,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(28, 8, 28, 0),
              child: Align(
                alignment: Alignment.centerRight,
                child: LocaleSwitcher(),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 24),

              const AppLogo(),
              const SizedBox(height: 48),

              // ── Email ────────────────────────────────────────────────────
              AuthTextField(
                controller: controller.emailController,
                hint: 'Type your email',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),

              // ── Password ─────────────────────────────────────────────────
              Obx(() => AuthTextField(
                    controller: controller.passwordController,
                    hint: 'Type your password',
                    obscure: !controller.passwordVisible.value,
                    suffix: GestureDetector(
                      onTap: controller.togglePasswordVisibility,
                      child: Icon(
                        controller.passwordVisible.value
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: AppColors.mutedText,
                        size: 22,
                      ),
                    ),
                  )),
              const SizedBox(height: 16),

              // ── Forgot password ──────────────────────────────────────────
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  onPressed: () {},
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    foregroundColor: AppColors.therapyBlue,
                  ),
                  child: Text(
                    'Forgot Password',
                    style: AppText.body.copyWith(color: AppColors.therapyBlue),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // ── Login button ─────────────────────────────────────────────
              GetBuilder<AuthController>(
                builder: (_) => Obx(
                  () => FilledButton(
                    onPressed:
                        controller.canLogin && !controller.isLoading.value
                            ? controller.login
                            : null,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.mintGreen,
                      disabledBackgroundColor: AppColors.dividerColor,
                      foregroundColor: AppColors.navyObsidian,
                      disabledForegroundColor: AppColors.mutedText,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: controller.isLoading.value
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.navyObsidian,
                            ),
                          )
                        : Text('Log in', style: AppText.heading3),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // ── OR divider ───────────────────────────────────────────────
              Row(
                children: [
                  const Expanded(child: Divider(color: AppColors.borderStrong)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'OR',
                      style: AppText.small.copyWith(
                        color: AppColors.mutedText,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: AppColors.borderStrong)),
                ],
              ),
              const SizedBox(height: 16),

              // ── Social login options ─────────────────────────────────────
              SocialButton(
                label: 'Continue with Apple',
                icon: Icons.apple_rounded,
                iconColor: AppColors.navyObsidian,
                onTap: controller.continueWithApple,
              ),
              const SizedBox(height: 10),
              SocialButton(
                label: 'Continue with Google',
                svgLetter: 'G',
                svgColor: const Color(0xFF4285F4),
                onTap: controller.continueWithGoogle,
              ),
              const SizedBox(height: 10),
              SocialButton(
                label: 'Continue with Facebook',
                icon: Icons.facebook_rounded,
                iconColor: const Color(0xFF1877F2),
                onTap: controller.continueWithFacebook,
              ),
              const SizedBox(height: 32),

              // ── Sign up link ─────────────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account?  ",
                    style: AppText.body.copyWith(color: AppColors.mutedText),
                  ),
                  GestureDetector(
                    onTap: () => Get.toNamed(Routes.REGISTER),
                    child: Text(
                      'Sign up',
                      style: AppText.body.copyWith(
                        color: AppColors.navyObsidian,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

}
