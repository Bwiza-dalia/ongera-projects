import 'package:flutter/material.dart';

/// All brand colors for Ongera Access.
abstract class AppColors {

  // ─── Backgrounds ───────────────────────────────────────────────────────────

  /// Primary canvas — white cards, modal surfaces.
  static const Color pureWhite = Color(0xFFFFFFFF);

  /// Page background — sits behind cards to give depth.
  static const Color cloudGray = Color(0xFFF4F6F9);

  /// Subtle section divider / input field background.
  static const Color softGray = Color(0xFFECEFF4);

  // ─── Text ──────────────────────────────────────────────────────────────────

  /// Primary text — headers, body copy, video descriptions.
  /// High contrast: 12:1 on white. Safe for stroke patients.
  static const Color navyObsidian = Color(0xFF19233C);

  /// Secondary text — captions, hints, metadata.
  /// Use only at 16px+ to maintain contrast for low-vision users.
  static const Color mutedText = Color(0xFF5A6480);

  /// Placeholder text — form inputs, search bars.
  static const Color placeholderText = Color(0xFF8E96B0);

  // ─── Borders & dividers ────────────────────────────────────────────────────

  /// Default divider between sections and cards.
  static const Color dividerColor = Color(0xFFE2E6EE);

  /// Stronger border — for focused inputs and card emphasis.
  static const Color borderStrong = Color(0xFFBEC5D6);

  // ─── Primary action — Mint Green ───────────────────────────────────────────

  /// Primary CTA — filled buttons, streak checkmarks, progress bars.
  /// Use navyObsidian as text on top (contrast 5.4:1 — passes WCAG AA).
  static const Color mintGreen = Color(0xFF2CDAA9);

  /// Mint tint — button hover ripple, selected state background.
  static const Color mintGreenLight = Color(0xFFD0F7EE);

  /// Mint deep — pressed state, active nav indicator.
  static const Color mintGreenDark = Color(0xFF1AAD84);

  // ─── Speech & Language module — Coral Red ─────────────────────────────────

  /// Speech module accent — top bar strip, icon color.
  static const Color speechCoral = Color(0xFFFF6B6B);

  /// Speech module icon background — light tint of coral.
  static const Color speechCoralLight = Color(0xFFFFEEEE);

  /// Speech module text on tint — dark coral for badge labels.
  static const Color speechCoralDark = Color(0xFFCC3333);

  // ─── Cognitive module — Therapy Blue ──────────────────────────────────────

  /// Cognitive module accent — graphs, active calendar days, nav tabs.
  static const Color therapyBlue = Color(0xFF4E89E8);

  /// Cognitive module icon background — light tint of blue.
  static const Color therapyBlueLight = Color(0xFFEEF4FD);

  /// Cognitive module text on tint — dark blue for badge labels.
  static const Color therapyBlueDark = Color(0xFF2C6BC4);

  // ─── Motion module — Soft Violet ──────────────────────────────────────────

  /// Motion module accent — physical activity, balance exercises.
  static const Color motionViolet = Color(0xFF9B6BFF);

  /// Motion module icon background — light tint of violet.
  static const Color motionVioletLight = Color(0xFFF0EAFF);

  /// Motion module text on tint — dark violet for badge labels.
  static const Color motionVioletDark = Color(0xFF6A3FCC);

  // ─── Locked / unassigned module ────────────────────────────────────────────

  /// Locked module accent strip — neutral gray.
  static const Color lockedGray = Color(0xFFB4B2A9);

  /// Locked module icon background.
  static const Color lockedGrayLight = Color(0xFFF4F4F2);

  /// Locked module text — muted label.
  static const Color lockedGrayDark = Color(0xFF888780);

  // ─── Motivation & milestones — Warm Amber ─────────────────────────────────

  /// Milestone badge fill — week completion, streak achievements.
  static const Color warmAmber = Color(0xFFFFA012);

  /// Amber tint — banner backgrounds, article card highlights.
  static const Color warmAmberLight = Color(0xFFFFF3E0);

  /// Amber deep — text on amber tint backgrounds.
  static const Color warmAmberDark = Color(0xFFCC7A00);

  // ─── Streak system ────────────────────────────────────────────────────────

  /// Completed day circle fill — uses mintGreen.
  /// (alias for semantic clarity in streak widgets)
  static const Color streakDone = mintGreen;

  /// Today's day circle border — uses mintGreen.
  static const Color streakToday = mintGreen;

  /// Today's day circle fill — light tint so border reads clearly.
  static const Color streakTodayFill = mintGreenLight;

  /// Future / incomplete day circle fill.
  static const Color streakEmpty = Color(0xFFE8EBF0);

  /// Future / incomplete day letter color.
  static const Color streakEmptyText = Color(0xFFB4B8C8);

  // ─── Semantic states ──────────────────────────────────────────────────────

  /// Success — exercise completed, goal reached.
  static const Color successGreen = Color(0xFF1AAD84);

  /// Success background tint.
  static const Color successGreenLight = Color(0xFFD0F7EE);

  /// Warning — session reminder, approaching deadline.
  static const Color warningAmber = Color(0xFFFFD043);

  /// Warning background tint.
  static const Color warningAmberLight = Color(0xFFFFFBE6);

  /// Error — failed attempt, network issue.
  static const Color errorRed = Color(0xFFE24B4A);

  /// Error background tint.
  static const Color errorRedLight = Color(0xFFFFEEEE);

  /// Info — doctor note, tip banner.
  static const Color infoBlue = Color(0xFF4E89E8);

  /// Info background tint.
  static const Color infoBlueLight = Color(0xFFEEF4FD);

  // ─── Overlay & scrim ──────────────────────────────────────────────────────

  /// Modal background scrim — semi-transparent dark overlay.
  static const Color scrim = Color(0x8019233C);

  /// Disabled element overlay — applied on top of any widget.
  static const Color disabledOverlay = Color(0x5AF4F6F9);

  // ─── Dark mode surfaces ────────────────────────────────────────────────────

  /// Page background in dark mode — deepest layer.
  static const Color darkBackground = Color(0xFF0F1520);

  /// Card surface in dark mode — sits above the page background.
  static const Color darkSurface = Color(0xFF19233C);

  /// Elevated card / input fill in dark mode.
  static const Color darkSurfaceMid = Color(0xFF1F2D47);

  /// Highest surface — modal, bottom sheet, nav bar.
  static const Color darkSurfaceHigh = Color(0xFF253352);

  /// Primary text in dark mode.
  static const Color darkTextPrimary = Color(0xFFF0F2F7);

  /// Secondary / muted text in dark mode.
  static const Color darkTextSecondary = Color(0xFF8B94AE);

  /// Divider line in dark mode.
  static const Color darkDivider = Color(0xFF2C3A54);

  /// Strong border in dark mode.
  static const Color darkBorderStrong = Color(0xFF3D4F6E);
}