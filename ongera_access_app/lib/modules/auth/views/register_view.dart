import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../routes/app_routes.dart';
import '../controllers/auth_controller.dart';
import '../widgets/auth_widgets.dart';
import '../widgets/locale_switcher.dart';

class RegisterView extends GetView<AuthController> {
  const RegisterView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cloudGray,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 8, 28, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Get.back(),
                    child: const Icon(
                      Icons.chevron_left_rounded,
                      size: 32,
                      color: AppColors.navyObsidian,
                    ),
                  ),
                  const Spacer(),
                  const LocaleSwitcher(),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 16),

              const AppLogo(),
              const SizedBox(height: 16),

              // ── Terms ────────────────────────────────────────────────────
              Text(
                'By continuing, you agree to OngeraAccess\'s\nTerms & Conditions and Privacy Policy',
                textAlign: TextAlign.center,
                style: AppText.small.copyWith(
                  color: AppColors.mutedText,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 36),

              // ── Social options ───────────────────────────────────────────
              SocialButton(
                label: 'Continue with Apple',
                icon: Icons.apple_rounded,
                iconColor: AppColors.navyObsidian,
                onTap: controller.continueWithApple,
              ),
              const SizedBox(height: 12),
              SocialButton(
                label: 'Continue with Google',
                svgLetter: 'G',
                svgColor: const Color(0xFF4285F4),
                onTap: controller.continueWithGoogle,
              ),
              const SizedBox(height: 12),
              SocialButton(
                label: 'Continue with Facebook',
                icon: Icons.facebook_rounded,
                iconColor: const Color(0xFF1877F2),
                onTap: controller.continueWithFacebook,
              ),
              const SizedBox(height: 12),

              // ── Email register ───────────────────────────────────────────
              FilledButton.icon(
                onPressed: () => Get.toNamed(Routes.REGISTER_FLOW),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.mintGreen,
                  foregroundColor: AppColors.navyObsidian,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.centerLeft,
                ),
                icon: const Padding(
                  padding: EdgeInsets.only(left: 16),
                  child: Icon(Icons.mail_outline_rounded, size: 24),
                ),
                label: Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Text(
                    'Create an OngeraAccess account',
                    style: AppText.body.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(height: 40),

              // ── Login link ───────────────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Have an account?  ',
                    style: AppText.body.copyWith(color: AppColors.mutedText),
                  ),
                  GestureDetector(
                    onTap: () => Get.back(),
                    child: Text(
                      'Login',
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
