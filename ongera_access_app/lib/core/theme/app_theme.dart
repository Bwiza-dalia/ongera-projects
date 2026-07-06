import 'package:flutter/material.dart';
import 'app_colors.dart';


import 'package:flutter/material.dart';

abstract class AppTheme {
  static const String _fontFamily = 'Lexend';

  // ─── Light theme ───────────────────────────────────────────────────────────

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      primary: AppColors.mintGreen,
      onPrimary: AppColors.navyObsidian,
      primaryContainer: AppColors.mintGreenLight,
      onPrimaryContainer: AppColors.mintGreenDark,

      secondary: AppColors.therapyBlue,
      onSecondary: AppColors.pureWhite,
      secondaryContainer: AppColors.therapyBlueLight,
      onSecondaryContainer: AppColors.therapyBlueDark,

      tertiary: AppColors.warmAmber,
      onTertiary: AppColors.navyObsidian,
      tertiaryContainer: AppColors.warmAmberLight,
      onTertiaryContainer: AppColors.warmAmberDark,

      error: AppColors.errorRed,
      onError: AppColors.pureWhite,
      errorContainer: AppColors.errorRedLight,
      onErrorContainer: AppColors.speechCoralDark,

      surface: AppColors.pureWhite,
      onSurface: AppColors.navyObsidian,
      surfaceContainerHighest: AppColors.cloudGray,
      surfaceContainerHigh: AppColors.softGray,
      onSurfaceVariant: AppColors.mutedText,

      outline: AppColors.dividerColor,
      outlineVariant: AppColors.borderStrong,

      scrim: AppColors.scrim,
    ),
    scaffoldBackgroundColor: AppColors.cloudGray,
    fontFamily: _fontFamily,
    textTheme: _lightTextTheme,
    elevatedButtonTheme: _elevatedButtonTheme,
    outlinedButtonTheme: _outlinedButtonTheme,
    textButtonTheme: _textButtonTheme,
    navigationBarTheme: _lightNavigationBarTheme,
    cardTheme: _lightCardTheme,
    appBarTheme: _lightAppBarTheme,
    dividerTheme: _dividerTheme,
    inputDecorationTheme: _lightInputTheme,
    chipTheme: _lightChipTheme,
    progressIndicatorTheme: _progressIndicatorTheme,
    iconTheme: const IconThemeData(color: AppColors.navyObsidian, size: 24),
  );

  // ─── Dark theme ────────────────────────────────────────────────────────────

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.dark(
      primary: AppColors.mintGreen,
      onPrimary: AppColors.navyObsidian,
      primaryContainer: AppColors.mintGreenDark,
      onPrimaryContainer: AppColors.mintGreenLight,

      secondary: AppColors.therapyBlue,
      onSecondary: AppColors.pureWhite,
      secondaryContainer: AppColors.therapyBlueDark,
      onSecondaryContainer: AppColors.therapyBlueLight,

      tertiary: AppColors.warmAmber,
      onTertiary: AppColors.navyObsidian,
      tertiaryContainer: AppColors.warmAmberDark,
      onTertiaryContainer: AppColors.warmAmberLight,

      error: AppColors.errorRed,
      onError: AppColors.pureWhite,
      errorContainer: AppColors.speechCoralDark,
      onErrorContainer: AppColors.errorRedLight,

      surface: AppColors.darkSurface,
      onSurface: AppColors.darkTextPrimary,
      surfaceContainerHighest: AppColors.darkSurfaceHigh,
      surfaceContainerHigh: AppColors.darkSurfaceMid,
      onSurfaceVariant: AppColors.darkTextSecondary,

      outline: AppColors.darkDivider,
      outlineVariant: AppColors.darkBorderStrong,

      scrim: AppColors.scrim,
    ),
    scaffoldBackgroundColor: AppColors.darkBackground,
    fontFamily: _fontFamily,
    textTheme: _darkTextTheme,
    elevatedButtonTheme: _elevatedButtonTheme,
    outlinedButtonTheme: _outlinedButtonTheme,
    textButtonTheme: _textButtonTheme,
    navigationBarTheme: _darkNavigationBarTheme,
    cardTheme: _darkCardTheme,
    appBarTheme: _darkAppBarTheme,
    dividerTheme: _darkDividerTheme,
    inputDecorationTheme: _darkInputTheme,
    chipTheme: _darkChipTheme,
    progressIndicatorTheme: _progressIndicatorTheme,
    iconTheme: const IconThemeData(color: AppColors.darkTextPrimary, size: 24),
  );

  // ─── Text themes ───────────────────────────────────────────────────────────

  static const TextTheme _lightTextTheme = TextTheme(
    displayLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w700,
      fontSize: 32,
      color: AppColors.navyObsidian,
      height: 1.2,
    ),
    displayMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w700,
      fontSize: 28,
      color: AppColors.navyObsidian,
      height: 1.2,
    ),
    headlineLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 24,
      color: AppColors.navyObsidian,
      height: 1.3,
    ),
    headlineMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 20,
      color: AppColors.navyObsidian,
      height: 1.3,
    ),
    titleLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 18,
      color: AppColors.navyObsidian,
      height: 1.4,
    ),
    titleMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 16,
      color: AppColors.navyObsidian,
      height: 1.4,
    ),
    titleSmall: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 14,
      color: AppColors.navyObsidian,
      height: 1.4,
    ),
    bodyLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w400,
      fontSize: 16,
      color: AppColors.navyObsidian,
      height: 1.6,
    ),
    bodyMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w400,
      fontSize: 14,
      color: AppColors.navyObsidian,
      height: 1.6,
    ),
    bodySmall: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w400,
      fontSize: 12,
      color: AppColors.mutedText,
      height: 1.5,
    ),
    labelLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 14,
      color: AppColors.navyObsidian,
      letterSpacing: 0.2,
    ),
    labelMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 12,
      color: AppColors.mutedText,
      letterSpacing: 0.2,
    ),
    labelSmall: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 11,
      color: AppColors.mutedText,
      letterSpacing: 0.4,
    ),
  );

  static const TextTheme _darkTextTheme = TextTheme(
    displayLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w700,
      fontSize: 32,
      color: AppColors.darkTextPrimary,
      height: 1.2,
    ),
    displayMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w700,
      fontSize: 28,
      color: AppColors.darkTextPrimary,
      height: 1.2,
    ),
    headlineLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 24,
      color: AppColors.darkTextPrimary,
      height: 1.3,
    ),
    headlineMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 20,
      color: AppColors.darkTextPrimary,
      height: 1.3,
    ),
    titleLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 18,
      color: AppColors.darkTextPrimary,
      height: 1.4,
    ),
    titleMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 16,
      color: AppColors.darkTextPrimary,
      height: 1.4,
    ),
    titleSmall: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 14,
      color: AppColors.darkTextPrimary,
      height: 1.4,
    ),
    bodyLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w400,
      fontSize: 16,
      color: AppColors.darkTextPrimary,
      height: 1.6,
    ),
    bodyMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w400,
      fontSize: 14,
      color: AppColors.darkTextPrimary,
      height: 1.6,
    ),
    bodySmall: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w400,
      fontSize: 12,
      color: AppColors.darkTextSecondary,
      height: 1.5,
    ),
    labelLarge: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w600,
      fontSize: 14,
      color: AppColors.darkTextPrimary,
      letterSpacing: 0.2,
    ),
    labelMedium: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 12,
      color: AppColors.darkTextSecondary,
      letterSpacing: 0.2,
    ),
    labelSmall: TextStyle(
      fontFamily: _fontFamily,
      fontWeight: FontWeight.w500,
      fontSize: 11,
      color: AppColors.darkTextSecondary,
      letterSpacing: 0.4,
    ),
  );

  // ─── Buttons (shared — mint works on both light and dark) ──────────────────

  static final ElevatedButtonThemeData _elevatedButtonTheme =
  ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.mintGreen,
      foregroundColor: AppColors.navyObsidian,
      disabledBackgroundColor: AppColors.lockedGray,
      disabledForegroundColor: AppColors.lockedGrayDark,
      minimumSize: const Size(48, 52),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontWeight: FontWeight.w600,
        fontSize: 16,
        letterSpacing: 0.2,
      ),
    ),
  );

  static final OutlinedButtonThemeData _outlinedButtonTheme =
  OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.mintGreen,
      side: const BorderSide(color: AppColors.mintGreen, width: 1.5),
      minimumSize: const Size(48, 52),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontWeight: FontWeight.w600,
        fontSize: 16,
        letterSpacing: 0.2,
      ),
    ),
  );

  static final TextButtonThemeData _textButtonTheme = TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: AppColors.therapyBlue,
      minimumSize: const Size(48, 48),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontWeight: FontWeight.w500,
        fontSize: 14,
      ),
    ),
  );

  // ─── Navigation bar ────────────────────────────────────────────────────────

  static final NavigationBarThemeData _lightNavigationBarTheme =
  NavigationBarThemeData(
    backgroundColor: AppColors.pureWhite,
    surfaceTintColor: Colors.transparent,
    shadowColor: Colors.transparent,
    indicatorColor: AppColors.mintGreenLight,
    height: 64,
    iconTheme: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return const IconThemeData(color: AppColors.mintGreenDark, size: 26);
      }
      return const IconThemeData(color: AppColors.mutedText, size: 24);
    }),
    labelTextStyle: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return const TextStyle(
          fontFamily: _fontFamily,
          color: AppColors.mintGreenDark,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        );
      }
      return const TextStyle(
        fontFamily: _fontFamily,
        color: AppColors.mutedText,
        fontSize: 12,
        fontWeight: FontWeight.w400,
      );
    }),
  );

  static final NavigationBarThemeData _darkNavigationBarTheme =
  NavigationBarThemeData(
    backgroundColor: AppColors.darkSurface,
    surfaceTintColor: Colors.transparent,
    shadowColor: Colors.transparent,
    indicatorColor: AppColors.mintGreenDark,
    height: 64,
    iconTheme: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return const IconThemeData(color: AppColors.mintGreen, size: 26);
      }
      return const IconThemeData(color: AppColors.darkTextSecondary, size: 24);
    }),
    labelTextStyle: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return const TextStyle(
          fontFamily: _fontFamily,
          color: AppColors.mintGreen,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        );
      }
      return const TextStyle(
        fontFamily: _fontFamily,
        color: AppColors.darkTextSecondary,
        fontSize: 12,
        fontWeight: FontWeight.w400,
      );
    }),
  );

  // ─── Cards ─────────────────────────────────────────────────────────────────

  static final CardThemeData _lightCardTheme = CardThemeData(
    color: AppColors.pureWhite,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: AppColors.dividerColor, width: 1),
    ),
  );

  static final CardThemeData _darkCardTheme = CardThemeData(
    color: AppColors.darkSurface,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: AppColors.darkDivider, width: 1),
    ),
  );

  // ─── App bar ───────────────────────────────────────────────────────────────

  static const AppBarTheme _lightAppBarTheme = AppBarTheme(
    backgroundColor: AppColors.pureWhite,
    foregroundColor: AppColors.navyObsidian,
    elevation: 0,
    surfaceTintColor: Colors.transparent,
    centerTitle: false,
    titleTextStyle: TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.navyObsidian,
      fontSize: 20,
      fontWeight: FontWeight.w600,
    ),
    iconTheme: IconThemeData(color: AppColors.navyObsidian, size: 24),
  );

  static const AppBarTheme _darkAppBarTheme = AppBarTheme(
    backgroundColor: AppColors.darkSurface,
    foregroundColor: AppColors.darkTextPrimary,
    elevation: 0,
    surfaceTintColor: Colors.transparent,
    centerTitle: false,
    titleTextStyle: TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.darkTextPrimary,
      fontSize: 20,
      fontWeight: FontWeight.w600,
    ),
    iconTheme: IconThemeData(color: AppColors.darkTextPrimary, size: 24),
  );

  // ─── Dividers ──────────────────────────────────────────────────────────────

  static const DividerThemeData _dividerTheme = DividerThemeData(
    color: AppColors.dividerColor,
    thickness: 1,
    space: 1,
  );

  static const DividerThemeData _darkDividerTheme = DividerThemeData(
    color: AppColors.darkDivider,
    thickness: 1,
    space: 1,
  );

  // ─── Input fields ──────────────────────────────────────────────────────────

  static final InputDecorationTheme _lightInputTheme = InputDecorationTheme(
    filled: true,
    fillColor: AppColors.softGray,
    hintStyle: const TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.placeholderText,
      fontSize: 14,
    ),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.dividerColor, width: 1),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.mintGreen, width: 1.5),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.errorRed, width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );

  static final InputDecorationTheme _darkInputTheme = InputDecorationTheme(
    filled: true,
    fillColor: AppColors.darkSurfaceHigh,
    hintStyle: const TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.darkTextSecondary,
      fontSize: 14,
    ),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.darkDivider, width: 1),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.mintGreen, width: 1.5),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.errorRed, width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );

  // ─── Chips ─────────────────────────────────────────────────────────────────

  static final ChipThemeData _lightChipTheme = ChipThemeData(
    backgroundColor: AppColors.softGray,
    selectedColor: AppColors.mintGreenLight,
    disabledColor: AppColors.lockedGrayLight,
    labelStyle: const TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.navyObsidian,
      fontSize: 12,
      fontWeight: FontWeight.w500,
    ),
    side: const BorderSide(color: AppColors.dividerColor, width: 1),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  );

  static final ChipThemeData _darkChipTheme = ChipThemeData(
    backgroundColor: AppColors.darkSurfaceHigh,
    selectedColor: AppColors.mintGreenDark,
    disabledColor: AppColors.darkSurfaceMid,
    labelStyle: TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.darkTextPrimary,
      fontSize: 12,
      fontWeight: FontWeight.w500,
    ),
    side: const BorderSide(color: AppColors.darkDivider, width: 1),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  );

  // ─── Progress indicator ────────────────────────────────────────────────────

  static const ProgressIndicatorThemeData _progressIndicatorTheme =
  ProgressIndicatorThemeData(
    color: AppColors.mintGreen,
    linearTrackColor: AppColors.mintGreenLight,
    linearMinHeight: 6,
    circularTrackColor: AppColors.mintGreenLight,
  );
}

class AppText {
  static const TextStyle heading1 = TextStyle(fontSize: 22, fontWeight: FontWeight.w500, height: 1.3, color: AppColors.navyObsidian);
  static const TextStyle heading2 = TextStyle(fontSize: 18, fontWeight: FontWeight.w500, height: 1.3, color: AppColors.navyObsidian);
  static const TextStyle heading3 = TextStyle(fontSize: 16, fontWeight: FontWeight.w500, height: 1.4, color: AppColors.navyObsidian);
  static const TextStyle body     = TextStyle(fontSize: 15, fontWeight: FontWeight.w400, height: 1.6, color: AppColors.navyObsidian);
  static const TextStyle small    = TextStyle(fontSize: 13, fontWeight: FontWeight.w400, height: 1.5, color: AppColors.mutedText);
  static const TextStyle label    = TextStyle(fontSize: 12, height: 1.3, color: AppColors.placeholderText);
}
