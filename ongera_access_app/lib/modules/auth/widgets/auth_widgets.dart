import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(
        children: [
          TextSpan(
            text: 'Ongera',
            style: AppText.heading1.copyWith(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: AppColors.navyObsidian,
            ),
          ),
          TextSpan(
            text: 'Access',
            style: AppText.heading1.copyWith(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: AppColors.navyObsidian,
            ),
          ),
        ],
      ),
    );
  }
}

class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.obscure = false,
    this.suffix,
  });

  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final bool obscure;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscure,
      style: AppText.body,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: AppText.body.copyWith(color: AppColors.placeholderText),
        filled: true,
        fillColor: AppColors.pureWhite,
        suffixIcon: suffix != null
            ? Padding(
                padding: const EdgeInsets.only(right: 14),
                child: suffix,
              )
            : null,
        suffixIconConstraints:
            const BoxConstraints(minWidth: 0, minHeight: 0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dividerColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.dividerColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.mintGreen, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}

class SocialButton extends StatelessWidget {
  const SocialButton({
    super.key,
    required this.label,
    required this.onTap,
    this.icon,
    this.iconColor,
    this.svgLetter,
    this.svgColor,
  });

  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? iconColor;
  final String? svgLetter;
  final Color? svgColor;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.navyObsidian,
        backgroundColor: AppColors.pureWhite,
        side: const BorderSide(color: AppColors.dividerColor),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.centerLeft,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            if (icon != null)
              Icon(icon, color: iconColor, size: 24)
            else
              Text(
                svgLetter ?? '',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: svgColor,
                ),
              ),
            const SizedBox(width: 16),
            Text(
              label,
              style: AppText.body.copyWith(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
